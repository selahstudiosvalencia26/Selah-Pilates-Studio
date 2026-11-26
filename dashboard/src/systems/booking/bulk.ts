"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canSave } from "@/kit/session";
import { todayInZone } from "@/kit/time";
import { err, ok, type Result } from "@/kit/result";
import { tellCustomer } from "./notify";
import { depositFor } from "./pricing";
import { permissionFor } from "./rules";
import type { Booking, Settings } from "./schema";
import { cancelBooking, confirmBooking, finishBooking, recordDeposit, removeBooking, restoreBooking } from "./service";
import { readData } from "./store";

// The same steps as on one booking, for the ones that were ticked. Each booking is checked on its own: its own permission, its own
// rules (a full class, a step that does not fit its state). One that cannot be done is left as it is and counted, the rest go ahead.
const input = z.strictObject({
  kind: z.enum(["paid", "done", "cancel", "delete", "restore"]),
  ids: z.array(z.string().regex(/^[a-f0-9]{12}$/)).min(1).max(50),
});
export type BulkKind = z.infer<typeof input>["kind"];

async function one(kind: BulkKind, id: string, b: Booking | undefined, settings: Settings): Promise<boolean> {
  if (kind === "restore") {
    if (!(await canSave("booking.delete"))) return false;
    await restoreBooking(id);
    return true;
  }
  if (!b) return false;
  if (kind === "delete") {
    if (!(await canSave("booking.delete"))) return false;
    await removeBooking(id);
    return true;
  }
  if (kind === "done") {
    if (b.status !== "confirmed" || !(await canSave(permissionFor("finish", b.status)))) return false;
    await finishBooking(id, b.status);
    return true;
  }
  if (kind === "cancel") {
    if ((b.status !== "requested" && b.status !== "confirmed") || !(await canSave(permissionFor("cancel", b.status)))) return false;
    await cancelBooking(id, b.status, true); // a deposit already paid is kept, never thrown away in bulk
    tellCustomer("cancelled", id);
    return true;
  }
  // paid: the money asked for arrived by GCash today. Without a payment to record, it is simply confirmed.
  if (b.status !== "requested") return false;
  const amount = b.depositAmount || depositFor(settings, b.price) || settings.depositAmount;
  if (b.deposit === "waiting" && amount > 0) {
    if (!(await canSave(permissionFor("recordDeposit", b.status)))) return false;
    await recordDeposit(id, b.status, { amount, method: "gcash", paidOn: todayInZone(settings.zone) });
  } else {
    if (!(await canSave(permissionFor("confirm", b.status)))) return false;
    await confirmBooking(id, b.status);
  }
  tellCustomer("confirmed", id);
  return true;
}

export async function bulkAction(raw: unknown): Promise<Result<{ done: string[]; skipped: number }>> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return err("Tick up to 50 bookings and try again.");
  const { kind, ids } = parsed.data;
  const { bookings, settings } = await readData();
  const done: string[] = [];
  for (const id of ids) {
    try {
      if (await one(kind, id, bookings.find((b) => b.id === id && b.deletedAt === null), settings)) done.push(id);
    } catch (e) {
      console.error("bulk booking step failed", kind, e instanceof Error ? e.name : "unknown");
    }
  }
  revalidatePath("/booking", "layout");
  return ok({ done, skipped: ids.length - done.length });
}
