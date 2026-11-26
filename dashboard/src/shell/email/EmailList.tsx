"use client";

import { useState, useTransition } from "react";
import Dialog from "@/kit/Dialog";
import Icon from "@/kit/Icon";
import { setEmailOn } from "./actions";

export type EmailRow = { id: string; label: string; when: string; to: string; required: boolean; on: boolean; sends: boolean; why: string };

const HELLO: Record<string, string> = { customer: "Hello Maria,", staff: "Hello team,", owner: "Hello," };
const TO: Record<string, string> = { customer: "Customer", staff: "Studio", owner: "Owner" };

// One system's emails as one compact list: what it is and when, who gets it, and a switch (or that it is not sent yet). A switch
// saves at once.
export default function EmailList({ system, title, icon, rows, from }: { system: string; title: string; icon: string; rows: EmailRow[]; from: string }) {
  const [on, setOn] = useState(() => Object.fromEntries(rows.map((r) => [r.id, r.on])));
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);
  const [shown, setShown] = useState<EmailRow | null>(null);
  const [, start] = useTransition();

  const flip = (id: string, next: boolean) => {
    setOn((all) => ({ ...all, [id]: next }));
    setNote(null);
    start(async () => {
      const r = await setEmailOn({ system, id, on: next });
      if (r.ok) return setNote({ text: "Saved.", bad: false });
      setOn((all) => ({ ...all, [id]: !next }));
      setNote({ text: r.message, bad: true });
    });
  };
  // The studio's own first, then what customers get.
  const ordered = [...rows].sort((a, b) => Number(a.to === "customer") - Number(b.to === "customer"));
  const sending = rows.filter((r) => r.sends && on[r.id]).length;

  return (
    <section aria-label={`${title} emails`} className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        <Icon name={icon} className="h-5 w-5 shrink-0 text-text-soft" />
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xs text-text-soft">
          {rows.length === 0 ? "Sends no emails" : `${sending} of ${rows.length} on`}
        </span>
        {note && (
          <span role="status" className={`ml-auto text-sm ${note.bad ? "text-danger" : "text-text-soft"}`}>
            {note.text}
          </span>
        )}
      </header>
      {ordered.length > 0 && (
        <ul className="divide-y divide-border">
          {ordered.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className={`text-sm ${r.sends ? "font-medium" : "text-text-soft"}`}>{r.label}</p>
                <p className="text-xs text-text-soft">{r.when}</p>
              </div>
              <span className="w-24 shrink-0 text-xs text-text-soft">To: {TO[r.to] ?? r.to}</span>
              <button type="button" onClick={() => setShown(r)} aria-label={`Preview: ${r.label}`} className="min-h-11 rounded-md px-2 text-sm text-text-soft underline underline-offset-4 hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
                Preview
              </button>
              <span className="flex w-28 shrink-0 justify-end">
                {r.sends ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on[r.id]}
                    aria-label={r.label}
                    disabled={r.required}
                    onClick={() => flip(r.id, !on[r.id])}
                    className={`relative h-6 w-11 rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${on[r.id] ? "border-accent bg-accent" : "border-border-strong bg-surface"}`}
                  >
                    <span aria-hidden className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform duration-150 motion-reduce:transition-none ${on[r.id] ? "translate-x-5" : ""}`} />
                  </button>
                ) : (
                  <span title={r.why} className="rounded-md bg-surface px-2 py-1 text-xs text-text-soft">
                    Not sent yet
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {ordered.some((r) => !r.sends && r.to === "customer") && <p className="border-t border-border px-5 py-3 text-xs text-text-soft">Emails to customers start once you have your own web address (for example yourstudio.com).</p>}
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
    </section>
  );
}
