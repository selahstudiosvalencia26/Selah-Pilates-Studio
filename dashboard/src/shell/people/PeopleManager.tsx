"use client";

import Avatar from "@/shell/frame/Avatar";
import { useEffect, useRef, useState } from "react";
import Icon from "@/kit/Icon";
import type { Manifest } from "@/shell/systems/manifest";
import { accessSummary, coveredBy, defaultRoles, dropCovered, roleBlurb, type Person, type Role } from "./roles";
import { buttonClass } from "@/kit/Button";

// The People screen (docs/dashboard/shell-plan.md, section 2): who has an account, what role each has, and what that lets them do,
// system by system, in plain words. The owner invites someone with a name, an email and their roles. Owner cannot be
// handed out here: only you, the builder, create the first owner. Kept on this screen until the database is connected.
const SAMPLE: Person[] = [
  { id: "p1", name: "Ana Reyes", email: "ana@example.com", roles: ["manager"], status: "active" },
  { id: "p2", name: "Ben Cruz", email: "ben@example.com", roles: ["staff"], status: "active" },
  { id: "p3", name: "Carla Diaz", email: "carla@example.com", roles: ["staff"], status: "invited" },
];

const input = "h-11 w-full rounded-lg border border-border-strong bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent aria-[invalid=true]:border-danger";

export default function PeopleManager({ systems, avatarUrl = null }: { systems: Manifest[]; avatarUrl?: string | null }) {
  const roles = defaultRoles(systems);
  const grantable = roles.filter((r) => !r.locked); // nobody makes an owner here
  const [people, setPeople] = useState<Person[]>(SAMPLE);
  const [inviting, setInviting] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null); // the person just added, who slides in
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inviting) nameRef.current?.focus();
  }, [inviting]);
  const [form, setForm] = useState({ first: "", last: "", email: "", roles: ["staff"] as string[] });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const taken = people.some((p) => p.email.toLowerCase() === form.email.trim().toLowerCase());
  const ready = form.first.trim().length > 0 && form.last.trim().length > 0 && emailOk && !taken && form.roles.length > 0;

  const setRoles = (id: string, next: string[]) => setPeople((all) => all.map((p) => (p.id === id ? { ...p, roles: next } : p)));

  const invite = () => {
    if (!ready) return;
    const id = `p${Date.now()}`;
    setFresh(id);
    setPeople((all) => [...all, { id, name: `${form.first.trim()} ${form.last.trim()}`, email: form.email.trim(), roles: form.roles, status: "invited" }]);
    setForm({ first: "", last: "", email: "", roles: ["staff"] });
    setInviting(false);
  };

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-soft">{people.length + 1} people, including you</p>
        <button type="button" aria-expanded={inviting} aria-controls="invite-panel" onClick={() => setInviting((v) => !v)} className={buttonClass("primary")}>
          <Icon name="plus" weight="semibold" className={`h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${inviting ? "rotate-45" : ""}`} />
          Invite someone
        </button>
      </div>

      <div id="invite-panel" inert={!inviting} className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${inviting ? "grid-rows-[1fr] opacity-100" : "-mt-8 grid-rows-[0fr] opacity-0"}`}>
        <div className="-m-1 min-h-0 overflow-hidden p-1">
        <form
          className="grid gap-6 rounded-xl bg-surface p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            invite();
          }}
          noValidate
        >
          <h2 className="text-base font-medium">Invite someone</h2>
          <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr]">
            <div className="grid gap-2">
              <label htmlFor="inv-first" className="text-sm font-medium">
                First name
              </label>
              <input id="inv-first" ref={nameRef} value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} maxLength={40} autoComplete="off" className={input} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="inv-last" className="text-sm font-medium">
                Last name
              </label>
              <input id="inv-last" value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} maxLength={40} autoComplete="off" className={input} />
            </div>
            <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
              <label htmlFor="inv-email" className="text-sm font-medium">
                Email
              </label>
              <input id="inv-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={254} autoComplete="off" aria-invalid={taken} aria-describedby="inv-email-note" className={input} />
              <p id="inv-email-note" role={taken ? "alert" : undefined} className={`min-h-5 text-[13px] ${taken ? "text-danger" : "text-text-soft"}`}>
                {taken ? "That email already has an account." : "They sign in with a code sent here."}
              </p>
            </div>
          </div>
          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-medium">What can they do?</legend>
            <RoleChoices roles={grantable} value={form.roles} onChange={(next) => setForm({ ...form, roles: next })} />
          </fieldset>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={() => setInviting(false)} className="h-11 rounded-lg px-4 text-sm text-text-soft transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
              Cancel
            </button>
            <button type="submit" disabled={!ready} className={buttonClass("primary")}>
              Send invite
            </button>
          </div>
        </form>
        </div>
      </div>

      <ul className="divide-y divide-border">
        <li className="flex min-h-[4.5rem] items-center gap-4 px-1">
          <Avatar name="Sample Owner" src={avatarUrl} className="h-9 w-9 text-sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium">Sample Owner</span>
            <span className="block text-[13px] text-text-soft">Owner · can do everything</span>
          </span>
          <span className="text-[13px] text-text-soft">You</span>
        </li>

        {people.map((p) => {
          const summary = accessSummary(p, roles, systems);
          return (
            <li key={p.id} className={fresh === p.id ? "row-in" : undefined}>
              <details className="group">
                <summary className="flex min-h-[4.5rem] list-none items-center gap-4 rounded-lg px-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                  <Avatar name={p.name} className="h-9 w-9 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{p.name}</span>
                    <span className="block truncate text-[13px] text-text-soft">
                      {p.email} · {p.roles.length ? p.roles.map((id) => roles.find((r) => r.id === id)?.name).join(", ") : "No role"}
                    </span>
                  </span>
                  <span className={`text-[13px] ${p.status === "invited" ? "text-warning" : "text-text-soft"}`}>{p.status === "invited" ? "Invited" : "Active"}</span>
                  <Icon name="chevron-down" weight="medium" className="h-5 w-5 shrink-0 text-text-soft transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="grid gap-5 pb-5 pl-14 pr-1">
                  <fieldset className="grid gap-3">
                    <legend className="mb-1 text-sm font-medium">Roles</legend>
                    <RoleChoices roles={grantable} value={p.roles} onChange={(next) => setRoles(p.id, next)} />
                  </fieldset>

                  <div className="grid gap-2">
                    <p className="text-sm font-medium">What {p.name.split(" ")[0]} can do</p>
                    {summary.length === 0 ? (
                      <p className="text-[13px] text-text-soft">{systems.length === 0 && p.roles.length > 0 ? `${p.name.split(" ")[0]} has the ${p.roles.map((id) => roles.find((r) => r.id === id)?.name).join(" and ")} role. Nothing has been added to the dashboard yet, so there is nothing for them to open.` : "Nothing yet. Give them a role."}</p>
                    ) : (
                      <ul className="grid gap-1 text-[13px]">
                        {summary.map((s) => (
                          <li key={s.name} className="flex gap-3">
                            <span className="w-24 shrink-0 text-text-soft">{s.name}</span>
                            <span>{s.actions.join(", ")}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="button" aria-disabled="true" className="inline-flex h-11 cursor-not-allowed items-center rounded-lg border border-border px-3 text-[13px] font-medium text-text-soft">
                      Switch off
                    </button>
                    <span className="text-[13px] text-text-soft">Signs them out at once. Their work stays.</span>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const toggleIn = (list: string[], id: string, on: boolean) => (on ? [...list, id] : list.filter((x) => x !== id));

// Roles as two-line choices: the name, and one plain sentence about what it means. More than one can be chosen.
function RoleChoices({ roles, value, onChange }: { roles: Role[]; value: string[]; onChange: (next: string[]) => void }) {
  const chosen = roles.filter((r) => value.includes(r.id));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {roles.map((r) => {
        const on = value.includes(r.id);
        const cover = on ? null : coveredBy(r, chosen);
        return (
          <label key={r.id} className={`flex min-h-[4.5rem] items-start gap-3 rounded-xl border p-4 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${cover ? "cursor-not-allowed border-border bg-card opacity-60" : on ? "cursor-pointer border-accent bg-selected" : "cursor-pointer border-border bg-card hover:bg-hover"}`}>
            <input type="checkbox" checked={on} disabled={!!cover} onChange={(e) => onChange(dropCovered(toggleIn(value, r.id, e.target.checked), roles))} className="sr-only" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{r.name}</span>
              <span className="mt-0.5 block text-[13px] text-text-soft">{cover ? `Already included in ${cover.name}.` : roleBlurb(r)}</span>
            </span>
            <span aria-hidden className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors duration-150 ${on ? "bg-accent text-accent-contrast" : "border border-border-strong"}`}>
              <Icon name="check" strokeWidth={2.6} className={`h-3.5 w-3.5 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${on ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
