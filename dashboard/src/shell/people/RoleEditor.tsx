"use client";

import { useState } from "react";
import Icon from "@/kit/Icon";
import Tick from "@/kit/Tick";
import { slideStyle, useSlide } from "@/kit/useSlide";
import AddSystemHint from "@/shell/systems/AddSystemHint";
import type { Manifest } from "@/shell/systems/manifest";
import { defaultRoles, describeLevel, isSensitive, levelOf, levelsFor, setLevel, setPermission, type Role } from "./roles";
import { buttonClass } from "@/kit/Button";

// The Roles screen (docs/dashboard/shell-plan.md, section 2). Pick a role, then pick ONE level for each system: None, See, Change,
// Approve or Everything. That covers nearly everything. "Customize" opens the detailed ticks for the rare exception.
// Owner is locked. Manager and Staff can be reset. The owner can make more roles ("Cashier").
// Changes are kept on this screen only until the database is connected.
export default function RoleEditor({ systems, installHref }: { systems: Manifest[]; installHref?: string }) {
  const start = defaultRoles(systems);
  const [roles, setRoles] = useState<Role[]>(start);
  const [current, setCurrent] = useState("staff");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const role = roles.find((r) => r.id === current) ?? roles[0];
  const slide = useSlide<HTMLDivElement>(role.id);

  const update = (next: Role) => setRoles((all) => all.map((r) => (r.id === next.id ? next : r)));
  const reset = () => update(start.find((r) => r.id === role.id) ?? role);

  const clean = name.trim().replace(/\s+/g, " ");
  const clash = roles.some((r) => r.name.toLowerCase() === clean.toLowerCase());
  const addRole = () => {
    if (!clean || clash || roles.length >= 20) return;
    const id = `custom-${Date.now()}`;
    const staff = roles.find((r) => r.id === "staff");
    setRoles((all) => [...all, { id, name: clean, builtin: false, locked: false, permissions: [...(staff?.permissions ?? [])] }]);
    setCurrent(id);
    setName("");
    setAdding(false);
  };

  return (
    <div className="grid gap-8">
      <div ref={slide.ref} className="relative flex flex-wrap items-center gap-2" role="tablist" aria-label="Roles">
        <span aria-hidden className="absolute left-0 top-0 rounded-lg bg-selected transition-[transform,width,height] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none" style={slideStyle(slide.box, slide.ready)} />
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={r.id === role.id}
            data-slide={r.id === role.id ? "on" : undefined}
            onClick={() => setCurrent(r.id)}
            className={`relative inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${r.id === role.id ? "font-medium text-text" : "text-text-soft hover:text-text"}`}
          >
            {r.name}
          </button>
        ))}
        {adding ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addRole();
            }}
          >
            <label className="sr-only" htmlFor="new-role">
              Role name
            </label>
            <input id="new-role" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Role name, e.g. Cashier" aria-invalid={clash} className="h-11 w-52 rounded-lg border border-border-strong bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent aria-[invalid=true]:border-danger" />
            <button type="submit" disabled={!clean || clash} className={buttonClass("primary")}>
              Add
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm text-text-soft transition-colors hover:bg-hover hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
            <Icon name="plus" weight="medium" className="h-4 w-4" />
            New role
          </button>
        )}
      </div>

      <p className="max-w-2xl text-sm text-text-soft">
        {role.locked ? "The Owner can do everything, and this cannot be changed." : `Choose what ${role.name} can do in each part of the dashboard.`}
      </p>

      {systems.length === 0 ? (
        <NoSystems installHref={installHref} />
      ) : (
        <ul className="divide-y divide-border">
          {systems.map((s) => {
            const levels = levelsFor(s);
            const now = role.locked ? "full" : levelOf(role, s);
            const level = levels.find((l) => l.id === now);
            return (
              <li key={s.id} className="grid gap-3 py-5">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <h2 className="text-[15px] font-medium">{s.name}</h2>
                  <div role="radiogroup" aria-label={`${role.name} in ${s.name}`} className="relative grid w-full auto-cols-fr grid-flow-col gap-0 rounded-lg border border-border-strong p-0.5 sm:w-auto">
                    {/* The coloured pill slides to the chosen level. It is one element moved with transform, so it stays smooth. */}
                    <span
                      aria-hidden
                      className="absolute inset-y-0.5 left-0.5 rounded-lg bg-accent transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
                      style={{ width: `calc((100% - 4px) / ${levels.length})`, transform: `translateX(${Math.max(levels.findIndex((l) => l.id === now), 0) * 100}%)`, opacity: levels.some((l) => l.id === now) ? 1 : 0 }}
                    />
                    {levels.map((l) => {
                      const on = l.id === now;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={role.locked}
                          onClick={() => update(setLevel(role, s, l.id))}
                          className={`relative h-11 whitespace-nowrap rounded-lg px-3.5 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.97] disabled:cursor-not-allowed ${on ? "font-medium text-accent-contrast" : "text-text-soft hover:text-text"}`}
                        >
                          {l.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[13px] text-text-soft">{level ? describeLevel(level, s) : "A mix you picked in Customize."}</p>

                {!role.locked && (
                  <details className="group">
                    <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-1 rounded-lg pr-2 text-[13px] text-text-soft transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                      Customize
                      <Icon name="chevron-down" weight="medium" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <ul className="mt-1 divide-y divide-border">
                      {s.permissions.map((p) => (
                        <li key={p.id} className="flex min-h-12 items-center justify-between gap-4 px-1 py-2">
                          <span className="min-w-0">
                            <span className="block text-sm">{p.label}</span>
                            {isSensitive(p.id) && <span className="block text-[13px] text-text-soft">Asks for confirmation</span>}
                          </span>
                          <Tick checked={role.permissions.includes(p.id)} onChange={(next) => update(setPermission(role, p.id, next))} label={`${role.name} can: ${p.label}`} hideLabel />
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {systems.length > 0 && (
      <div className="flex flex-wrap items-center gap-3">
        {role.builtin && !role.locked && (
          <button type="button" onClick={reset} className={buttonClass("quiet")}>
            Reset to the usual
          </button>
        )}
        <p className="text-[13px] text-text-soft">Changes apply when saved and are written to the activity log. Saving turns on when the database is connected.</p>
      </div>
      )}
    </div>
  );
}

// Shown while no system is added yet: what this screen will do, with a faded example of one row.
function NoSystems({ installHref }: { installHref?: string }) {
  const levels = ["None", "See", "Change", "Approve", "Everything"];
  return (
    <div className="grid gap-4">
      <div className="rounded-xl bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">Nothing to choose yet</h2>
        <p className="mt-1 text-sm text-text-soft">No tools have been added yet. Once they are, you decide here what each role can do with it: nothing, only look, make changes, approve things, or everything.</p>
        <div className="mt-4">
          <AddSystemHint installHref={installHref} />
        </div>
      </div>
      <div aria-hidden inert className="rounded-xl border border-dashed border-border-strong p-5 opacity-60">
        <p className="mb-3 text-[13px] text-text-soft">Example of what it will look like</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] font-medium">Bookings</p>
          <div className="inline-flex gap-0.5 rounded-lg border border-border-strong p-0.5">
            {levels.map((l) => (
              <span key={l} className={`rounded-lg px-3 py-2 text-sm ${l === "Change" ? "bg-accent font-medium text-accent-contrast" : "text-text-soft"}`}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
