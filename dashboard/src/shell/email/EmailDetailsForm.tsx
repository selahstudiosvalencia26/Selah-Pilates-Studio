"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import Icon from "@/kit/Icon";
import type { EmailDetails } from "@/kit/emailSettings";
import { Field, Input } from "@/kit/Input";
import SaveBar, { type SaveMessage } from "@/kit/SaveBar";
import { saveEmailDetails, sendTestEmail } from "./actions";

// Set up once, used by every system's emails. One studio email gets both customer replies and booking alerts, so there is one box for
// it and nothing to decide. Under it, a real test, then each system's emails.
export default function EmailDetailsForm({ initial, suggestion, ready, children }: { initial: EmailDetails; suggestion?: string; ready: boolean; children?: React.ReactNode }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState<SaveMessage>(null);
  const [pending, start] = useTransition();
  const next: EmailDetails = { ...v, staffTo: v.replyTo };
  const dirty = JSON.stringify(next) !== JSON.stringify(saved);
  const set = (patch: Partial<EmailDetails>) => (setV({ ...v, ...patch }), setMessage(null));
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
    <form onSubmit={submit} noValidate aria-label="Email settings" className="flex grow flex-col">
      <section aria-label="Your email" className="card grid gap-5 p-5">
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <div className="grid gap-2">
            <Field label="Your studio email" hint="New booking and receipt alerts come here.">
              {(p) => <Input {...p} type="email" autoComplete="email" placeholder="you@yourstudio.com" value={v.replyTo} onChange={(e) => set({ replyTo: e.target.value })} />}
            </Field>
            {suggestion && !mine && (
              <button type="button" onClick={() => set({ replyTo: suggestion })} className="inline-flex min-h-11 min-w-0 items-center gap-2 justify-self-start rounded-lg bg-surface px-3.5 text-sm font-medium transition-colors duration-150 hover:bg-selected focus-visible:outline-2 focus-visible:outline-accent">
                <Icon name="plus" className="h-4 w-4 shrink-0" />
                <span className="break-all">Use {suggestion}</span>
              </button>
            )}
          </div>
          <Field label="Name customers see" hint="Shown as the sender in their inbox.">
            {(p) => <Input {...p} value={v.senderName} maxLength={60} onChange={(e) => set({ senderName: e.target.value })} />}
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="flex items-center gap-2 text-sm">
            <Icon name={ready ? "check" : "warning"} weight="medium" className={`h-4 w-4 shrink-0 ${ready ? "text-success" : "text-warning"}`} />
            {ready ? "Email is connected." : "Email is not connected yet."}
          </p>
          {ready && (
            <button type="button" className={buttonClass()} disabled={pending || dirty} onClick={test}>
              {dirty ? "Save first to test" : "Send test email"}
            </button>
          )}
        </div>
      </section>

      {/* The emails themselves, each with its switch. They save as soon as they are switched. */}
      {children && <div className="mt-4">{children}</div>}

      <SaveBar dirty={dirty} pending={pending} message={message} />
    </form>
  );
}
