"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import Icon from "@/kit/Icon";
import type { EmailDetails } from "@/kit/emailSettings";
import { Field, Input } from "@/kit/Input";
import SaveBar, { type SaveMessage } from "@/kit/SaveBar";
import { saveEmailDetails, sendTestEmail } from "./actions";

// Set up once, used by every system's emails. One studio email gets both customer replies and booking alerts, so there is one box for
// it and nothing to decide. Beside it, an example of the alert the studio gets, and a real test.
export default function EmailDetailsForm({ initial, suggestion, ready, customers }: { initial: EmailDetails; suggestion?: string; ready: boolean; customers: boolean }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState<SaveMessage>(null);
  const [pending, start] = useTransition();
  const next: EmailDetails = { ...v, staffTo: v.replyTo };
  const dirty = JSON.stringify(next) !== JSON.stringify(saved);
  const set = (patch: Partial<EmailDetails>) => (setV({ ...v, ...patch }), setMessage(null));
  const name = v.senderName.trim() || "Your studio";
  const mine = v.replyTo.trim();

  const test = () =>
    start(async () => {
      const r = await sendTestEmail();
      setMessage(r.ok ? { text: `Sent to ${r.data.to}. Check the inbox and spam.` } : { text: r.message, bad: true });
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveEmailDetails(next);
      if (r.ok) {
        setSaved(next);
        setV(next);
      }
      setMessage(r.ok ? { text: "Saved." } : { text: r.message, bad: true });
    });
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Email settings" className="flex grow flex-col pt-5">
      <p role="note" className="card mb-6 flex items-start gap-3 p-4 text-sm">
        <Icon name={ready ? "check" : "warning"} weight="medium" className={`mt-0.5 h-4 w-4 shrink-0 ${ready ? "text-success" : "text-warning"}`} />
        <span>
          <span className="font-semibold">{ready ? "Booking alerts are on." : "Email is not connected yet."}</span>{" "}
          <span className="text-text-soft">{ready ? `You get an email for each new booking and receipt. ${customers ? "Customers who give an email are told too." : "Customers are not emailed yet: that needs your own web address."}` : "You can fill this in now, so it is ready."}</span>
        </span>
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="card grid gap-6 p-5 sm:p-6">
          <Field label="Your studio email" hint="New booking and receipt alerts come here.">
            {(p) => <Input {...p} type="email" autoComplete="email" placeholder="you@yourstudio.com" value={v.replyTo} onChange={(e) => set({ replyTo: e.target.value })} />}
          </Field>
          {suggestion && !mine && (
            <button type="button" onClick={() => set({ replyTo: suggestion })} className="-mt-3 inline-flex min-h-11 min-w-0 items-center gap-2 justify-self-start rounded-lg bg-surface px-3.5 text-sm font-medium transition-colors duration-150 hover:bg-selected focus-visible:outline-2 focus-visible:outline-accent">
              <Icon name="plus" className="h-4 w-4 shrink-0" />
              <span className="break-all">Use {suggestion}</span>
            </button>
          )}
          <Field label="Name customers see" hint="Shown as the sender in their inbox.">
            {(p) => <Input {...p} value={v.senderName} maxLength={60} onChange={(e) => set({ senderName: e.target.value })} />}
          </Field>
        </div>

        <section aria-label="Example" className="grid gap-3">
          <p className="text-sm font-medium">What happens when someone books</p>
          <div className="card grid gap-1 p-5">
            <p className="break-all text-xs text-text-soft">You get, at {mine || "your studio email"}</p>
            <p className="text-sm font-semibold">New booking request</p>
            <p className="text-sm">Maria, Sculpt, Monday 9:00 AM</p>
          </div>
        </section>
      </div>

      <SaveBar dirty={dirty} pending={pending} message={message}>
        {ready && (
          <button type="button" className={buttonClass()} disabled={pending || dirty} onClick={test}>
            Send test email
          </button>
        )}
      </SaveBar>
    </form>
  );
}
