"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import CopyButton from "@/kit/CopyButton";
import Icon from "@/kit/Icon";
import { Field, Input } from "@/kit/Input";
import type { Member } from "@/lib/auth/members";
import { addPerson, newPasswordFor, removePerson, restorePerson, setPersonRoles } from "./actions";
import type { Role } from "./roles";
import { inviteMessage, tempPassword } from "./tempPassword";

// The team: add someone with a ready-made password, send them the message yourself, change their role, or remove them (with Undo).
type Sent = { name: string; email: string; password: string };

const chip = (on: boolean) =>
  `inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${on ? "border-accent bg-selected font-medium" : "border-border-strong hover:bg-hover"}`;

function Roles({ roles, chosen, onPick, label }: { roles: Role[]; chosen: string[]; onPick: (ids: string[]) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {roles.map((r) => (
        <button key={r.id} type="button" role="radio" aria-checked={chosen.includes(r.id)} onClick={() => onPick([r.id])} className={chip(chosen.includes(r.id))}>
          {r.name}
        </button>
      ))}
    </div>
  );
}

const noChange = () => () => {};

export default function Team({ owners, members, roles, business }: { owners: string[]; members: Member[]; roles: Role[]; business: string }) {
  const grantable = roles.filter((r) => !r.locked);
  const origin = useSyncExternalStore(noChange, () => window.location.origin, () => "");
  const [form, setForm] = useState({ name: "", email: "", roles: ["staff"], password: "" });
  const [adding, setAdding] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [removed, setRemoved] = useState<Member | null>(null);
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();
  const set = (patch: Partial<typeof form>) => (setForm({ ...form, ...patch }), setProblem(""));
  const ready = form.name.trim() !== "" && form.email.includes("@") && form.password !== "";

  const run = (work: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await work();
      setProblem(r.ok ? "" : (r.message ?? "That did not work."));
      if (r.ok) after?.();
    });

  const open = () => {
    setForm({ name: "", email: "", roles: ["staff"], password: tempPassword() });
    setSent(null);
    setProblem("");
    setAdding(true);
  };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    run(
      () => addPerson(form),
      () => {
        setSent({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
        setAdding(false);
      },
    );
  };
  const reset = (m: Member) => {
    const password = tempPassword();
    run(
      () => newPasswordFor({ email: m.email, password }),
      () => setSent({ name: m.name, email: m.email, password }),
    );
  };

  const message = sent ? inviteMessage(sent.name, `${origin}/sign-in`, sent.email, sent.password, business) : "";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-soft">{owners.length + members.length} people can sign in</p>
        <button type="button" onClick={adding ? () => setAdding(false) : open} aria-expanded={adding} className={buttonClass("primary")}>
          {adding ? "Cancel" : "Add person"}
        </button>
      </div>

      {problem && (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      {adding && (
        <form onSubmit={add} noValidate aria-label="Add person" className="card grid gap-5 p-5 transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">{(p) => <Input {...p} autoFocus value={form.name} maxLength={60} autoComplete="off" onChange={(e) => set({ name: e.target.value })} />}</Field>
            <Field label="Email" hint="They sign in with this.">
              {(p) => <Input {...p} type="email" value={form.email} maxLength={120} autoComplete="off" onChange={(e) => set({ email: e.target.value })} />}
            </Field>
          </div>
          <div className="grid gap-2">
            <p className="text-[13px] font-medium">Role</p>
            <Roles roles={grantable} chosen={form.roles} onPick={(ids) => set({ roles: ids })} label="Role" />
          </div>
          <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Field label="Temporary password" hint="Keep this one, or erase it and type your own (12 characters or more).">
              {(p) => <Input {...p} value={form.password} maxLength={72} autoComplete="off" spellCheck={false} onChange={(e) => set({ password: e.target.value })} />}
            </Field>
            <button type="button" onClick={() => set({ password: "" })} className={`${buttonClass()} sm:mb-[1.375rem]`}>
              Erase
            </button>
            <button type="button" onClick={() => set({ password: tempPassword() })} className={`${buttonClass()} sm:mb-[1.375rem]`}>
              New one
            </button>
          </div>
          <div>
            <button type="submit" disabled={!ready || pending} className={buttonClass("primary")}>
              {pending ? "Adding" : "Add person"}
            </button>
          </div>
        </form>
      )}

      {sent && (
        <section aria-label="Message to send" className="card grid gap-3 border-accent p-5">
          <p className="text-sm font-semibold">Send this to {sent.name}. The password is shown only now.</p>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-text-soft">{message}</pre>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={message} label="Copy for Messenger" />
            <button type="button" onClick={() => setSent(null)} className={buttonClass("quiet")}>
              Done
            </button>
          </div>
        </section>
      )}

      {removed && (
        <p role="status" className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span>{removed.name} was removed and can no longer get in.</span>
          <button type="button" disabled={pending} onClick={() => run(() => restorePerson(removed), () => setRemoved(null))} className={buttonClass()}>
            Undo
          </button>
        </p>
      )}

      <ul className="grid gap-3">
        {owners.map((email) => (
          <li key={email} className="card flex items-center justify-between gap-4 p-4">
            <span className="min-w-0 break-words text-sm font-medium">{email}</span>
            <span className="shrink-0 text-xs text-text-soft">Owner · can do everything</span>
          </li>
        ))}
        {members.map((m) => (
          <li key={m.email} className="card grid gap-3 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{m.name}</span>
                <span className="block truncate text-xs text-text-soft">{m.email}</span>
              </span>
              <span className="shrink-0 text-xs text-text-soft">{m.mustChange ? "Has not signed in yet" : "Active"}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Roles roles={grantable} chosen={m.roles} onPick={(ids) => run(() => setPersonRoles({ email: m.email, roles: ids }))} label={`Role for ${m.name}`} />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => reset(m)} className={buttonClass()}>
                  New password
                </button>
                <button type="button" disabled={pending} onClick={() => run(() => removePerson(m.email), () => setRemoved(m))} className={buttonClass("quiet")}>
                  <Icon name="trash" className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
