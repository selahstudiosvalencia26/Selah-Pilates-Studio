"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import { saveDomain } from "./actions";
import { EMAIL_LIMITS, megabytes, SPACE_LIMITS, type EmailCount, type Space } from "./count";
import type { DomainState } from "./domain";
import type { Domain } from "./store";

// What can run out: the domain, the emails and the database space. Only what is truly known is shown as a number;
// the rest says why not, or where to look.
const box = "h-11 w-full rounded-xl border border-border-strong bg-card px-3 text-base text-text sm:text-sm focus-visible:outline-2 focus-visible:outline-accent";
const tone = { fine: "text-success", soon: "text-warning", lapsed: "text-danger" } as const;

type Row = { label: string; used: number; limit: number; words: string };

const emailRows = (e: Extract<EmailCount, { ok: true }>): Row[] => {
  const limit = EMAIL_LIMITS[e.via];
  return [
    { label: "Today", used: e.today, limit: limit.day, words: `${e.today} of ${limit.day}` },
    { label: "This month", used: e.month, limit: limit.month, words: `${e.month} of ${limit.month}` },
  ];
};
const spaceRows = (s: Extract<Space, { ok: true }>): Row[] => [
  { label: "Information", used: s.database, limit: SPACE_LIMITS.database, words: `${megabytes(s.database)} of ${megabytes(SPACE_LIMITS.database)}` },
  { label: "Photos", used: s.files, limit: SPACE_LIMITS.files, words: `${megabytes(s.files)} of ${megabytes(SPACE_LIMITS.files)}` },
];
const emailWords = (e: EmailCount) =>
  e.ok ? `Sent by this dashboard through ${e.via === "gmail" ? "Gmail" : "Resend"}. Days are counted in UTC.` : "Counted once email is connected.";
const spaceWords = (s: Space) =>
  s.ok ? "Free plan limits." : s.why === "off" ? "Shown once Supabase is connected." : "Run the file 002_usage.sql in Supabase to see this.";

function Meter({ title, rows, note }: { title: string; note: string; rows: Row[] }) {
  return (
    <li className="grid content-start gap-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.map((r) => (
        <div key={r.label} className="grid gap-1.5">
          <p className="flex justify-between gap-3 text-[13px]">
            <span className="text-text-soft">{r.label}</span>
            <span className="font-medium tabular-nums">{r.words}</span>
          </p>
          <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-selected">
            <span className={`block h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none ${r.used / r.limit >= 0.8 ? "bg-warning" : "bg-accent"}`} style={{ width: `${Math.min(100, r.used > 0 ? Math.max(2, (r.used / r.limit) * 100) : 0)}%` }} />
          </span>
        </div>
      ))}
      <p className="text-[13px] text-text-soft">{note}</p>
    </li>
  );
}

export default function UsagePanel({ domain, state, emails, space }: { domain: Domain; state: DomainState | null; emails: EmailCount; space: Space }) {
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
        <Meter title="Emails sent" note={emailWords(emails)} rows={emails.ok ? emailRows(emails) : []} />
        <Meter title="Database space" note={spaceWords(space)} rows={space.ok ? spaceRows(space) : []} />
      </ul>
    </div>
  );
}
