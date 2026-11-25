"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Select from "@/kit/Select";
import { cancelAction, confirmAction, declineAction, depositAction, finishAction, removeAction } from "./actions";
import { METHODS, METHOD_NAMES, type Booking } from "./schema";
import { area, btn, field, hintCls, labelCls, link, primary } from "./ui";

// The steps a person can take on one booking. Only the steps that make sense for its state are shown, each says what it does,
// and anything bigger than a click (decline, deposit, cancel) opens a small panel right here instead of a new page.
type Panel = null | "decline" | "deposit" | "cancel";

export default function BookingActions({ booking: b, depositDefault, today }: { booking: Booking; depositDefault: string; today: string }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState(depositDefault);
  const [method, setMethod] = useState<string>(METHODS[0]);
  const [paidOn, setPaidOn] = useState(today);
  const [keep, setKeep] = useState(true);

  const run = (job: () => Promise<{ ok: boolean; message?: string }>, then?: () => void) =>
    start(async () => {
      setProblem("");
      const r = await job();
      if (!r.ok) return setProblem(r.message ?? "That did not go through. Check your connection and try again.");
      setPanel(null);
      if (then) then();
      else router.refresh();
    });

  const open = (p: Panel) => (setPanel(panel === p ? null : p), setProblem(""));
  const live = b.status === "requested" || b.status === "confirmed";
  const asking = b.status === "requested" && b.deposit === "waiting";

  return (
    <section aria-label="Steps" className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {b.status === "requested" && !asking && !b.sessionKey && (
          <button type="button" className={primary} disabled={pending} onClick={() => run(() => confirmAction(b.id, b.status))}>
            {pending ? "Working" : "Confirm"}
          </button>
        )}
        {b.status === "requested" && (
          <button type="button" className={asking ? primary : btn} aria-expanded={panel === "deposit"} onClick={() => open("deposit")}>
            {asking ? "Payment received" : "Record deposit"}
          </button>
        )}
        {b.status === "requested" && (
          <button type="button" className={btn} aria-expanded={panel === "decline"} onClick={() => open("decline")}>
            Decline
          </button>
        )}
        {b.status === "confirmed" && (
          <button type="button" className={primary} disabled={pending} onClick={() => run(() => finishAction(b.id, b.status))}>
            {pending ? "Working" : "Mark done"}
          </button>
        )}
        {live && !b.sessionKey && (
          <Link href={`/booking/${b.id}/edit`} className={btn}>
            Change details
          </Link>
        )}
        {live && (
          <button type="button" className={btn} aria-expanded={panel === "cancel"} onClick={() => open("cancel")}>
            Cancel booking
          </button>
        )}
        <button type="button" className={`${link} ml-auto`} disabled={pending} onClick={() => run(() => removeAction(b.id), () => router.push(`/booking?removed=${b.id}`))}>
          Delete
        </button>
      </div>

      {panel === "decline" && (
        <form className="grid gap-3 rounded-xl border border-border p-4" onSubmit={(e) => (e.preventDefault(), run(() => declineAction(b.id, b.status, note)))}>
          <div>
            <label htmlFor="decline-note" className={labelCls}>
              Reason for the customer (optional)
            </label>
            <textarea id="decline-note" className={area} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button type="submit" className={primary} disabled={pending}>
            {pending ? "Working" : "Decline request"}
          </button>
        </form>
      )}

      {panel === "deposit" && (
        <form className="grid gap-4 rounded-xl border border-border p-4" onSubmit={(e) => (e.preventDefault(), run(() => depositAction(b.id, b.status, { amount, method, paidOn })))}>
          <p className="text-sm text-text-soft">Check the money arrived first. This confirms the booking and {b.sessionKey ? "keeps the slot" : "locks the date"}.</p>
          <div>
            <label htmlFor="dep-amount" className={labelCls}>
              Amount received (₱)
            </label>
            <input id="dep-amount" inputMode="decimal" className={field} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dep-method" className={labelCls}>
                Paid by
              </label>
              <Select id="dep-method" label="Paid by" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: METHOD_NAMES[m] }))} />
            </div>
            <div>
              <label htmlFor="dep-date" className={labelCls}>
                Date received
              </label>
              <input id="dep-date" type="date" className={field} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </div>
          </div>
          <button type="submit" className={primary} disabled={pending}>
            {pending ? "Working" : b.sessionKey ? "Confirm payment" : "Confirm payment and lock the date"}
          </button>
        </form>
      )}

      {panel === "cancel" && (
        <form className="grid gap-3 rounded-xl border border-border p-4" onSubmit={(e) => (e.preventDefault(), run(() => cancelAction(b.id, b.status, keep)))}>
          <p className="text-sm">{b.sessionKey ? "This frees the slot. The customer is not told automatically." : "This frees the date. The customer is not told automatically."}</p>
          {b.deposit === "paid" && (
            <fieldset className="grid gap-2">
              <legend className={labelCls}>What about the deposit?</legend>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="radio" name="keep" checked={keep} onChange={() => setKeep(true)} /> Keep it
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="radio" name="keep" checked={!keep} onChange={() => setKeep(false)} /> Mark it void (refunded)
              </label>
              <p className={hintCls}>It stays in the history either way. Money is never deleted.</p>
            </fieldset>
          )}
          <button type="submit" className={primary} disabled={pending}>
            {pending ? "Working" : "Yes, cancel this booking"}
          </button>
        </form>
      )}

      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${problem ? "text-danger" : "text-text-soft"}`}>
        {problem}
      </p>
    </section>
  );
}
