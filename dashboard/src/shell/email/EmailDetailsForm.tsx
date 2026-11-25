"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import type { EmailDetails } from "@/kit/emailSettings";
import { Field, Input } from "@/kit/Input";
import SaveBar, { type SaveMessage } from "@/kit/SaveBar";
import { saveEmailDetails, sendTestEmail } from "./actions";

// Set up once, used by every system's emails.
export default function EmailDetailsForm({ initial }: { initial: EmailDetails }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState<SaveMessage>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  const set = (patch: Partial<EmailDetails>) => (setV({ ...v, ...patch }), setMessage(null));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveEmailDetails(v);
      if (r.ok) setSaved(v);
      setMessage(r.ok ? { text: "Saved." } : { text: r.message, bad: true });
    });
  };
  const test = () =>
    start(async () => {
      const r = await sendTestEmail();
      setMessage(r.ok ? { text: "Test email sent." } : { text: r.message, bad: true });
    });

  return (
    <form onSubmit={submit} noValidate aria-label="Email settings" className="grid gap-5 pt-5">
      <div className="grid gap-5">
        <Field label="Sender name" hint="The name people see on your emails.">
          {(p) => <Input {...p} value={v.senderName} maxLength={60} onChange={(e) => set({ senderName: e.target.value })} />}
        </Field>
        <Field label="Replies go to" hint="When a customer answers an email, it arrives here.">
          {(p) => <Input {...p} type="email" value={v.replyTo} onChange={(e) => set({ replyTo: e.target.value })} />}
        </Field>
        <Field label="Staff alerts go to" hint="For example, a new booking request.">
          {(p) => <Input {...p} type="email" value={v.staffTo} onChange={(e) => set({ staffTo: e.target.value })} />}
        </Field>
      </div>
      <SaveBar dirty={dirty} pending={pending} message={message}>
        <button type="button" className={buttonClass()} disabled={pending} onClick={test}>
          Send test email
        </button>
      </SaveBar>
    </form>
  );
}
