"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Select from "@/kit/Select";
import { saveClasses } from "./actions";
import {
  classListSchema,
  isTemporary,
  type ClassItem,
  type ClassKind,
  type ClassList,
} from "./site/classList";
import Collapse from "./Collapse";
import type { Photos } from "./photoRules";
import PhotoRows from "./PhotosForm";
import { Remove } from "./Remove";
import { useUndo } from "./Undo";
import { useSavePart } from "./SaveGroup";
import { classSlot } from "./site/slots";
import { btn, field, hintCls, labelCls } from "./ui";

// The class list: every class and private session, in the order the website shows them. A row shows the name and the facts at a
// glance; Edit opens the rest (note, level, focus, length, price and the photo). Add a class or a private session at the bottom.
// Everything stays in this screen until Save. The Home class row, the Class page, the footer and the contact form all read this list.
type Row = Omit<ClassItem, "durationMinutes" | "pricePhp"> & {
  durationMinutes: string;
  pricePhp: string;
};

const toRow = (c: ClassItem): Row => ({
  ...c,
  durationMinutes: c.durationMinutes == null ? "" : String(c.durationMinutes),
  pricePhp: c.pricePhp == null ? "" : String(c.pricePhp),
});
const num = (v: string): number | null =>
  v.trim() === "" ? null : Number(v.trim().replace(/,/g, ""));
const toItem = (r: Row): ClassItem => ({
  ...r,
  durationMinutes: num(r.durationMinutes),
  pricePhp: num(r.pricePhp),
});
const tempId = () => `new-${Math.random().toString(36).slice(2, 8)}`;
const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};
const peso = (n: string) =>
  n.trim() === ""
    ? ""
    : `₱${Number(n.replace(/,/g, "")).toLocaleString("en-PH")}`;

const LENGTHS = ["30", "45", "50", "55", "60", "75", "90"];
const LEVELS = ["All levels", "Beginners", "Intermediate", "Advanced", "Seniors"];
const FOCUSES = ["Strength", "Core", "Flexibility", "Balance", "Posture", "Recovery"];
const choices = (list: string[], current: string, none?: string, say = (v: string) => v) => [
  ...(none ? [{ value: "", label: none }] : []),
  ...(current && !list.includes(current) ? [current, ...list] : list).map((v) => ({ value: v, label: say(v) })),
];

const GROUPS: { kind: ClassKind; title: string; add: string }[] = [
  { kind: "Group mat class", title: "Group classes", add: "Add a group class" },
  { kind: "Private reformer session", title: "Private sessions", add: "Add a private session" },
];

export default function ClassesForm({
  initial,
  photos,
  times,
}: {
  initial: ClassList;
  photos: Photos;
  /** Where each saved class shows its weekly times, when the screen has a booking system to ask. */
  times?: (facts: { name: string; session: boolean; minutes: number | null; price: number | null }) => React.ReactNode;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));
  const [open, setOpen] = useState<string | null>(null);
  const [bad, setBad] = useState<string | null>(null); // the slug of the row with a problem
  const [dirty, setDirty] = useState(false);
  const [more, setMore] = useState(false); // the optional extras of the open row
  const undo = useUndo();

  const change = (next: Row[]) => {
    setRows(next);
    setDirty(true);
  };
  const edit = (slug: string, part: Partial<Row>) =>
    change(rows.map((r) => (r.slug === slug ? { ...r, ...part } : r)));
  const add = (group: ClassKind) => {
    const slug = tempId();
    change([
      ...rows,
      {
        slug,
        name: "",
        group,
        summary: "",
        level: "",
        focus: "",
        durationMinutes: "55",
        pricePhp: "",
      },
    ]);
    setOpen(slug);
  };

  const prices = [...new Set(rows.map((r) => r.pricePhp.trim().replace(/,/g, "")).filter(Boolean))].sort((a, b) => Number(a) - Number(b)).slice(0, 6);

  // Joins the screen's one Save (see ./SaveGroup.tsx). Returns the problem in plain words, or null when it worked.
  useSavePart("class-list", dirty, async () => {
    const parsed = classListSchema.safeParse(rows.map(toItem));
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      const at = typeof i.path[0] === "number" ? rows[i.path[0]] : undefined;
      if (at) {
        setBad(at.slug);
        setOpen(at.slug);
      }
      return `${at?.name ? `${at.name}: ` : ""}${i.message}`;
    }
    const r = await saveClasses(parsed.data);
    if (!r.ok) return r.message;
    // Classes that were new now have their real ids.
    setRows((all) =>
      all.map((row, n) => ({ ...row, slug: r.data.slugs[n] ?? row.slug })),
    );
    setOpen((o) => (o && isTemporary(o) ? null : o));
    setBad(null);
    setDirty(false);
    router.refresh();
    return null;
  });

  return (
    <div role="group" aria-label="Class list" className="grid gap-5">
      <p className="max-w-2xl text-sm text-text-soft">
        The classes and private sessions your studio offers, in the order the
        website shows them. Changes here show on the Home page, the Class page,
        the footer and the contact form.
      </p>
      {GROUPS.map((g) => {
        const own = rows.filter((x) => x.group === g.kind);
        // Move up and down stay inside their own list.
        const swap = (slug: string, by: number) => {
          const other = own[own.findIndex((x) => x.slug === slug) + by];
          if (!other) return;
          const from = rows.findIndex((x) => x.slug === slug);
          change(move(rows, from, rows.findIndex((x) => x.slug === other.slug)));
        };
        return (
          <section key={g.kind} aria-label={g.title} className="grid gap-3">
            <h2 className="text-base font-medium">{g.title}</h2>
            {own.length === 0 && <p className="text-sm text-text-soft">None yet.</p>}
            <ul className="grid gap-3 empty:hidden">
              {own.map((r, i) => {
          const isOpen = open === r.slug;
          const saved = !isTemporary(r.slug);
          const facts = [
            r.durationMinutes && `${r.durationMinutes} min`,
            peso(r.pricePhp),
          ]
            .filter(Boolean)
            .join(" · ");
          const id = `class-${r.slug}`;
          return (
            <li key={r.slug} className="rounded-xl border border-border">
              <div className="flex items-center gap-4 p-3 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.name.trim() || "New class"}
                  </p>
                  <p className="text-xs text-text-soft">{facts}</p>
                </div>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : r.slug)}
                  className={btn}
                >
                  {isOpen ? "Done" : "Edit"}
                </button>
              </div>
              <Collapse open={isOpen}>
                <div className="grid gap-5 border-t border-border p-4">
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <label htmlFor={`${id}-name`} className={labelCls}>
                        Name
                      </label>
                      <input id={`${id}-name`} value={r.name} aria-invalid={(bad === r.slug && r.name.trim() === "") || undefined} onChange={(e) => edit(r.slug, { name: e.target.value })} className={field} />
                    </div>
                    <div>
                      <label htmlFor={`${id}-length`} className={labelCls}>
                        Length
                      </label>
                      <Select id={`${id}-length`} label="Length" value={r.durationMinutes} onChange={(v) => edit(r.slug, { durationMinutes: v })} options={choices(LENGTHS, r.durationMinutes, "Not set", (v) => `${v} minutes`)} />
                    </div>
                    <div>
                      <label htmlFor={`${id}-price`} className={labelCls}>
                        Price (pesos)
                      </label>
                      <input id={`${id}-price`} inputMode="numeric" value={r.pricePhp} onChange={(e) => edit(r.slug, { pricePhp: e.target.value })} className={field} />
                      {prices.length > 0 && (
                        <div role="group" aria-label="Prices you already use" className="mt-2 flex flex-wrap gap-2">
                          {prices.map((p) => (
                            <button key={p} type="button" aria-pressed={r.pricePhp.replace(/,/g, "") === p} onClick={() => edit(r.slug, { pricePhp: p })} className={`${btn} aria-pressed:border-accent`}>
                              {peso(p)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {times &&
                    (saved && r.name.trim() ? (
                      times({ name: r.name.trim(), session: r.group === "Private reformer session", minutes: num(r.durationMinutes), price: num(r.pricePhp) === null ? null : Math.round(num(r.pricePhp)! * 100) })
                    ) : (
                      <p className="text-sm text-text-soft">Save the class first, then you can set its times.</p>
                    ))}

                  <div>
                    <button type="button" className={btn} aria-expanded={more} onClick={() => setMore(!more)}>
                      {more ? "Hide extras" : "Add a note or level (optional)"}
                    </button>
                  </div>
                  {more && (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label htmlFor={`${id}-summary`} className={labelCls}>
                          Short note
                        </label>
                        <input id={`${id}-summary`} value={r.summary} onChange={(e) => edit(r.slug, { summary: e.target.value })} className={field} />
                        <p className={hintCls}>One line, like &ldquo;Best for beginners.&rdquo;</p>
                      </div>
                      <div>
                        <label htmlFor={`${id}-level`} className={labelCls}>
                          Level
                        </label>
                        <Select id={`${id}-level`} label="Level" value={r.level} onChange={(v) => edit(r.slug, { level: v })} options={choices(LEVELS, r.level, "None")} />
                      </div>
                      <div>
                        <label htmlFor={`${id}-focus`} className={labelCls}>
                          Focus
                        </label>
                        <Select id={`${id}-focus`} label="Focus" value={r.focus} onChange={(v) => edit(r.slug, { focus: v })} options={choices(FOCUSES, r.focus, "None")} />
                      </div>
                    </div>
                  )}

                  {saved ? (
                    <PhotoRows
                      places={[classSlot(r)]}
                      saved={photos}
                      group={`class-list-${r.slug}`}
                    />
                  ) : (
                    <p className="text-sm text-text-soft">
                      Save the class first, then you can add its photo.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={btn}
                      disabled={i === 0}
                      onClick={() => swap(r.slug, -1)}
                      aria-label={`Move ${r.name || "this class"} up`}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className={btn}
                      disabled={i === own.length - 1}
                      onClick={() => swap(r.slug, 1)}
                      aria-label={`Move ${r.name || "this class"} down`}
                    >
                      Move down
                    </button>
                    <span className="ml-auto">
                      <Remove
                        button
                        what={r.name || "this class"}
                        onRemove={() => {
                          const before = rows;
                          change(rows.filter((x) => x.slug !== r.slug));
                          undo.offer(`Removed ${r.name.trim() || "the class"}.`, () => change(before));
                        }}
                      />
                    </span>
                  </div>
                </div>
              </Collapse>
            </li>
          );
        })}
            </ul>
            <div>
              <button type="button" className={btn} disabled={rows.length >= 30} onClick={() => add(g.kind)}>
                {g.add}
              </button>
            </div>
          </section>
        );
      })}
      {undo.view}
    </div>
  );
}
