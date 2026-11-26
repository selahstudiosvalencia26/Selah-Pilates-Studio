"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import Dialog from "@/kit/Dialog";
import Toggle from "@/kit/Toggle";
import { sendTestEmail, setEmailOn } from "./actions";

export type EmailRow = { id: string; label: string; when: string; to: string; required: boolean; on: boolean; sends: boolean; why: string };

const TO: Record<string, string> = { customer: "To the customer", staff: "To your staff", owner: "To the owner" };
const HELLO: Record<string, string> = { customer: "Hello Maria,", staff: "Hello team,", owner: "Hello," };

// A system's emails: when each one is sent, a switch, a preview and a test. A switch saves at once.
export default function EmailList({ system, rows, from }: { system: string; rows: EmailRow[]; from: string }) {
  const [on, setOn] = useState(() => Object.fromEntries(rows.map((r) => [r.id, r.on])));
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);
  const [shown, setShown] = useState<EmailRow | null>(null);
  const [tested, setTested] = useState("");
  const [pending, start] = useTransition();

  const flip = (id: string, next: boolean) => {
    setOn((all) => ({ ...all, [id]: next }));
    setNote(null);
    setTested("");
    start(async () => {
      const r = await setEmailOn({ system, id, on: next });
      if (r.ok) return setNote({ text: "Saved.", bad: false });
      setOn((all) => ({ ...all, [id]: !next }));
      setNote({ text: r.message, bad: true });
    });
  };
  // The answer is shown under the button that was pressed, where it is seen.
  const test = (id: string) => {
    setTested(id);
    setNote(null);
    start(async () => {
      const r = await sendTestEmail();
      setNote(r.ok ? { text: `Sent to ${r.data.to}. Check the inbox and spam.`, bad: false } : { text: r.message, bad: true });
    });
  };

  return (
    <div className="grid gap-4">
      {!tested && note && (
        <p role="status" className={`text-sm ${note.bad ? "text-danger" : "text-text-soft"}`}>
          {note.text}
        </p>
      )}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((r) => (
          <li key={r.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
            {/* An email that cannot be sent has no switch to flip and nothing to test: the reason is said instead. */}
            <Toggle checked={on[r.id]} disabled={r.required || !r.sends} onChange={(next) => flip(r.id, next)} label={r.label} hint={[r.when, TO[r.to], r.required && "Always sent", !r.sends && r.why].filter(Boolean).join(" · ")} />
            <div className="flex gap-2">
              <button type="button" className={buttonClass("quiet")} onClick={() => setShown(r)} aria-label={`Preview: ${r.label}`}>
                Preview
              </button>
              {r.sends && (
                <button type="button" className={buttonClass()} disabled={pending} onClick={() => test(r.id)} aria-label={`Send a test: ${r.label}`}>
                  {pending && tested === r.id ? "Sending" : "Send test"}
                </button>
              )}
            </div>
            {tested === r.id && note && (
              <p role="status" className={`text-sm sm:col-span-2 ${note.bad ? "text-danger" : "text-text-soft"}`}>
                {note.text}
              </p>
            )}
          </li>
        ))}
      </ul>
      <Dialog open={shown !== null} onClose={() => setShown(null)} title="Sample email">
        {shown && (
          <div className="grid gap-3 text-sm">
            <p className="text-text-soft">From: {from}</p>
            <p className="font-medium">{shown.label}</p>
            <div className="grid gap-2 rounded-xl bg-surface p-4">
              <p>{HELLO[shown.to]}</p>
              <p>{shown.label}.</p>
              <p>{from}</p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
