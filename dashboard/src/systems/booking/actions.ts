"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { databaseOn } from "@/kit/database";
import { fail } from "@/kit/errors";
import { parseAmount } from "@/kit/money";
import { EVERYTHING, can, permissionsOf } from "@/kit/permissions";
import { attempt, err, type Result } from "@/kit/result";
import { signedInOwner } from "@/kit/session";
import { permissionFor, type Action } from "./rules";
import { METHODS, fieldsSchema, noteSchema, settingsSchema, STATUSES, type Status } from "./schema";
import { addBooking, bookClass, cancelBooking, confirmBooking, declineBooking, editBooking, finishBooking, recordDeposit, removeBooking, restoreBooking, saveSettings, saveTimetable } from "./service";

// What staff can do, as actions the screens call. Each one checks who may do it, checks the input again (the form can be bypassed),
// then hands over to the service. Nobody is signed in on a live site until sign-in is connected, so on a live site every action refuses.
// While building, the sample owner stands in for the person: `whoIsAsking` is the one place that changes when sign-in lands.
const NOT_CONNECTED = "Saving is not connected yet.";
const whoIsAsking = () => permissionsOf([[EVERYTHING]]);

const firstProblem = (issues: { message: string }[]) => issues[0]?.message ?? "Check the details and try again.";

async function guard(permission: string, run: () => Promise<unknown>): Promise<Result<undefined>> {
  // On a live site: only with the database set up, and only for a signed-in owner. Checked here, on the server, every time.
  if (process.env.NODE_ENV === "production" && !(databaseOn() && (await signedInOwner()))) return err(NOT_CONNECTED);
  if (!can(whoIsAsking(), permission)) return err("You do not have permission to do this.");
  const done = await attempt(run, (e) => console.error("booking action failed", e instanceof Error ? e.message : "unknown"));
  if (done.ok) revalidatePath("/booking", "layout");
  return done.ok ? { ok: true, data: undefined } : done;
}

const status = z.enum(STATUSES);
const id = z.string().regex(/^[a-f0-9]{12}$/);
const step = (action: Action, expect: Status) => permissionFor(action, expect);

export async function addBookingAction(input: unknown): Promise<Result<undefined>> {
  const p = fieldsSchema.safeParse(input);
  if (!p.success) return err(firstProblem(p.error.issues));
  return guard("booking.edit", () => addBooking(p.data, "staff"));
}

const classInput = z.strictObject({ sessionKey: z.string().regex(/^[a-f0-9]{8}@\d{4}-\d{2}-\d{2}$/), customerName: fieldsSchema.shape.customerName, phone: fieldsSchema.shape.phone, email: fieldsSchema.shape.email, spots: z.number().int().min(1).max(500), notes: z.string().max(500) });

export async function addClassBookingAction(input: unknown): Promise<Result<undefined>> {
  const p = classInput.safeParse(input);
  if (!p.success) return err(firstProblem(p.error.issues));
  return guard("booking.edit", () => bookClass(p.data, "staff"));
}

export async function editBookingAction(bookingId: string, expect: Status, input: unknown): Promise<Result<undefined>> {
  const ids = id.safeParse(bookingId);
  const p = fieldsSchema.safeParse(input);
  if (!ids.success || !status.safeParse(expect).success) return err("We could not find that booking.");
  if (!p.success) return err(firstProblem(p.error.issues));
  return guard(step("edit", expect), () => editBooking(bookingId, expect, p.data));
}

const ref = z.tuple([id, status]);
const bad = err("We could not find that booking.");

export async function confirmAction(bookingId: string, expect: Status): Promise<Result<undefined>> {
  if (!ref.safeParse([bookingId, expect]).success) return bad;
  return guard(step("confirm", expect), () => confirmBooking(bookingId, expect));
}

export async function declineAction(bookingId: string, expect: Status, note: string): Promise<Result<undefined>> {
  const n = noteSchema.safeParse(note);
  if (!ref.safeParse([bookingId, expect]).success) return bad;
  if (!n.success) return err(firstProblem(n.error.issues));
  return guard(step("decline", expect), () => declineBooking(bookingId, expect, n.data));
}

export async function depositAction(bookingId: string, expect: Status, input: { amount: string; method: string; paidOn: string }): Promise<Result<undefined>> {
  if (!ref.safeParse([bookingId, expect]).success) return bad;
  const amount = parseAmount(input.amount);
  const method = z.enum(METHODS).safeParse(input.method);
  const paidOn = fieldsSchema.shape.date.safeParse(input.paidOn);
  if (amount === null || amount <= 0) return err("Enter the amount that was paid, like 5000 or 5,000.50.");
  if (!method.success) return err("Choose how it was paid.");
  if (!paidOn.success) return err("Enter the date it was received.");
  return guard(step("recordDeposit", expect), () => recordDeposit(bookingId, expect, { amount, method: method.data, paidOn: paidOn.data }));
}

export async function cancelAction(bookingId: string, expect: Status, keepDeposit: boolean): Promise<Result<undefined>> {
  if (!ref.safeParse([bookingId, expect]).success) return bad;
  return guard(step("cancel", expect), () => cancelBooking(bookingId, expect, keepDeposit === true));
}

export async function finishAction(bookingId: string, expect: Status): Promise<Result<undefined>> {
  if (!ref.safeParse([bookingId, expect]).success) return bad;
  return guard(step("finish", expect), () => finishBooking(bookingId, expect));
}

export async function removeAction(bookingId: string): Promise<Result<undefined>> {
  if (!id.safeParse(bookingId).success) return bad;
  return guard("booking.delete", () => removeBooking(bookingId));
}

export async function restoreAction(bookingId: string): Promise<Result<undefined>> {
  if (!id.safeParse(bookingId).success) return bad;
  return guard("booking.delete", () => restoreBooking(bookingId));
}

export async function saveSettingsAction(input: unknown): Promise<Result<undefined>> {
  const p = settingsSchema.safeParse(input);
  if (!p.success) return err(firstProblem(p.error.issues));
  const ids = new Set(p.data.timetable.map((c) => c.id));
  if (ids.size !== p.data.timetable.length) return err("Two classes share the same id. Reload the page and try again.");
  return guard("booking.manage", async () => {
    if (!p.data.zone) fail("Choose a time zone.");
    await saveSettings(p.data);
  });
}

// The Classes and sessions screen saves only the weekly list, so it never overwrites other settings.
export async function saveTimetableAction(input: unknown): Promise<Result<undefined>> {
  const p = settingsSchema.shape.timetable.safeParse(input);
  if (!p.success) return err(firstProblem(p.error.issues));
  if (new Set(p.data.map((c) => c.id)).size !== p.data.length) return err("Two classes share the same id. Reload the page and try again.");
  return guard("booking.manage", () => saveTimetable(p.data));
}
