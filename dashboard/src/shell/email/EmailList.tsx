"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import Dialog from "@/kit/Dialog";
import Toggle from "@/kit/Toggle";
import { sendTestEmail, setEmailOn } from "./actions";

export type EmailRow = { id: string; label: string; when: string; to: string; required: boolean; on: boolean; sends: boolean; why: string };

const HELLO: Record<string, string> = { customer: "Hello Maria,", staff: "Hello team,", owner: "Hello," };

// A system's emails, in two groups: the ones that come to the studio and the ones that go to customers. A switch saves at once.
// An email that cannot be sent has no switch: the reason is written once for the group, or on the row.
export default function EmailList({ system, rows, from }: { system: string; rows: EmailRow[]; from: string }) {
  const [on, setOn] = useState(() => Object.fromEntries(rows.map((r) => [r.id, r.on])));
  const [note, setNote] = useState<{ id: string; text: string; bad: boolean } | null>(null);
  const [shown, setShown] = useState<EmailRow | null>(null);
  const [pending, start] = useTransition();

  const flip = (id: string, next: boolean) => {
    setOn((all) => ({ ...all, [id]: next }));
    setNote(null);
    start(async () => {
      const r = await setEmailOn({ system, id, on: next });
      if (r.ok) return setNote({ id, text: "Saved.", bad: false });
      setOn((all) => ({ ...all, [id]: !next }));
      setNote({ id, text: r.message, bad: true });
    });
  };
  // The answer is shown under the row that was pressed, where it is seen.
  const test = (id: string) => {
    setNote(null);
    start(async () => {
      const r = await sendTestEmail();
      setNote(r.ok ? { id, text: `Sent to ${r.data.to}. Check the inbox and spam.`, bad: false } : { id, text: r.message, bad: true });
    });
  };

  const groups = [
    { title: "To your studio email", rows: rows.filter((r) => r.to !== "customer") },
    { title: "To your customers", rows: rows.filter((r) => r.to === "customer") },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {groups.map((g) => {
        const none = g.rows.every((r) => !r.sends);
        return (
          <section key={g.title} aria-label={g.title} className="card grid content-start gap-1 p-5">
            <h2 className="text-base font-semibold">{g.title}</h2>
            {none && <p className="text-sm text-text-soft">Not sent yet. These start once you have your own web address.</p>}
            <ul className="mt-2 divide-y divide-border">
              {g.rows.map((r) => (
                <li key={r.id} className="grid gap-2 py-3">
                  {r.sends ? (
                    <Toggle checked={on[r.id]} disabled={r.required} onChange={(next) => flip(r.id, next)} label={r.label} hint={[r.when, r.required && "Always sent"].filter(Boolean).join(" · ")} />
                  ) : (
                    <div className="min-h-11 opacity-70">
                      <p className="text-sm">{r.label}</p>
                      <p className="mt-0.5 text-xs text-text-soft">{none ? r.when : `${r.when} · ${r.why}`}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={buttonClass("quiet")} onClick={() => setShown(r)} aria-label={`Preview: ${r.label}`}>
                      Preview
                    </button>
                    {r.sends && r.to !== "customer" && (
                      <button type="button" className={buttonClass()} disabled={pending} onClick={() => test(r.id)} aria-label={`Send a test: ${r.label}`}>
                        Send test
                      </button>
                    )}
                  </div>
                  {note?.id === r.id && (
                    <p role="status" className={`text-sm ${note.bad ? "text-danger" : "text-text-soft"}`}>
                      {note.text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
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
