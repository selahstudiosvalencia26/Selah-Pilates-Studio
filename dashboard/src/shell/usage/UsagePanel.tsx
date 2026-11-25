"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import { saveDomain } from "./actions";
import type { DomainState } from "./domain";
import type { Domain } from "./store";

// What can run out: the domain, the emails and the database space. Only what is truly known is shown as a number;
// the rest says when it will be.
const box = "h-11 w-full rounded-xl border border-border-strong bg-card px-3 text-base text-text sm:text-sm focus-visible:outline-2 focus-visible:outline-accent";
const tone = { fine: "text-success", soon: "text-warning", lapsed: "text-danger" } as const;

export default function UsagePanel({ domain, state, emailReady, databaseReady }: { domain: Domain; state: DomainState | null; emailReady: boolean; databaseReady: boolean }) {
  const [v, setV] = useState(domain);
  const [saved, setSaved] = useState(domain);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const dirty = v.name !== saved.name || v.renewsOn !== saved.renewsOn;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveDomain(v);
      if (r.ok) setSaved(v);
      setNote(r.ok ? "Saved." : r.message);
    });
  };

  return (
    <div className="grid gap-3">
      <form onSubmit={save} noValidate aria-label="Domain renewal" className="grid gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-sm font-semibold">Domain{saved.name ? ` · ${saved.name}` : ""}</h3>
          <span role="status" className={`text-[13px] ${state ? tone[state.level] : "text-text-soft"}`}>
            {state ? state.words : "Add your renewal date to be reminded."}
          </span>
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid gap-1.5 text-[13px] font-medium">
            Domain name
            <input className={box} value={v.name} placeholder="yourshop.com" autoComplete="off" onChange={(e) => (setV({ ...v, name: e.target.value }), setNote(""))} />
          </label>
          <label className="grid gap-1.5 text-[13px] font-medium">
            Renews on
            <input type="date" className={box} value={v.renewsOn} onChange={(e) => (setV({ ...v, renewsOn: e.target.value }), setNote(""))} />
          </label>
          <button type="submit" className={buttonClass("primary")} disabled={pending || !dirty}>
            {pending ? "Saving" : "Save"}
          </button>
        </div>
        <p className="text-[13px] text-text-soft">{note || "Find the date where you bought the domain, for example Namecheap, under Domain List."}</p>
      </form>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[
          { title: "Emails sent", ready: emailReady, wait: "Counted once Resend is connected.", where: "Today, see resend.com, Usage." },
          { title: "Database space", ready: databaseReady, wait: "Shown once Supabase is connected.", where: "Today, see supabase.com, your project, Usage." },
        ].map((c) => (
          <li key={c.title} className="grid gap-1 rounded-xl border border-dashed border-border-strong p-4">
            <h3 className="text-sm font-semibold">{c.title}</h3>
            <p className="text-[13px] text-text-soft">{c.ready ? "Connected. The count comes with the next update." : c.wait}</p>
            <p className="text-[13px] text-text-soft">{c.where}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
