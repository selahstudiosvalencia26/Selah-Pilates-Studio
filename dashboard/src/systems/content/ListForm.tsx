"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Select from "@/kit/Select";
import Toggle from "@/kit/Toggle";
import { saveList } from "./actions";
import Collapse from "./Collapse";
import {
  isTemporary,
  listSchemaFor,
  listSlot,
  tempId,
  type ListDef,
  type ListField,
  type ListItem,
} from "./listDef";
import type { Photos } from "./photoRules";
import PhotoRows from "./PhotosForm";
import { listById } from "./site/lists";
import { Remove } from "./Remove";
import { useUndo } from "./Undo";
import { useSavePart } from "./SaveGroup";
import { btn, field, hintCls, labelCls } from "./ui";

// One list of the website, edited: every item in the order the website shows them. A row shows the name and the facts at a glance;
// Edit opens the rest (the fields and the photo). Add buttons sit under the list. Everything stays in this screen until Save.
// What the list is about (classes, menu, projects) comes from the client's description (./site/lists.ts), not from this file.
type Row = { slug: string } & Record<string, string>;

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v.trim().replace(/,/g, "")));
const toRow = (def: ListDef, item: ListItem): Row => {
  const row: Row = { slug: item.slug };
  for (const f of def.fields) {
    const v = item[f.key];
    row[f.key] = v == null ? (f.type === "boolean" ? "false" : "") : String(v);
  }
  return row;
};
const toItem = (def: ListDef, row: Row): ListItem => {
  const item: ListItem = { slug: row.slug };
  for (const f of def.fields) {
    const v = row[f.key] ?? "";
    item[f.key] = f.type === "number" ? num(v) : f.type === "boolean" ? v === "true" : v;
  }
  return item;
};
const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

// The facts shown under the name: the choice, then each number with its prefix or suffix.
function facts(def: ListDef, row: Row): string {
  return def.fields
    .map((f) => {
      const v = (row[f.key] ?? "").trim();
      if (!v || f.key === def.nameKey) return "";
      if (f.type === "choice") return v;
      if (f.type === "boolean") return v === "true" ? f.label : "";
      if (f.type === "date") return v;
      if (f.type === "number") {
        const n = Number(v.replace(/,/g, ""));
        return `${f.prefix ?? ""}${Number.isFinite(n) ? n.toLocaleString("en-PH") : v}${f.suffix ? ` ${f.suffix}` : ""}`;
      }
      return "";
    })
    .filter(Boolean)
    .join(" · ");
}

function Input({ id, f, value, invalid, onChange }: { id: string; f: ListField; value: string; invalid?: boolean; onChange: (v: string) => void }) {
  return (
    <div className={f.type === "text" && f.long ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={labelCls}>
        {f.label}
      </label>
      {f.type === "boolean" ? (
        <Toggle id={id} checked={value === "true"} onChange={(on) => onChange(on ? "true" : "false")} label={f.hint ?? "On"} />
      ) : f.type === "text" && f.long ? (
        <textarea id={id} value={value} rows={f.max > 1000 ? 14 : 3} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} className={`${field} h-auto py-2`} />
      ) : f.type === "choice" ? (
        <Select id={id} label={f.label} value={value} onChange={onChange} options={f.options.map((o) => ({ value: o, label: o }))} invalid={invalid} />
      ) : (
        <input
          id={id}
          value={value}
          type={f.type === "date" ? "date" : undefined}
          inputMode={f.type === "number" ? "numeric" : undefined}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={field}
        />
      )}
      {f.hint && f.type !== "boolean" ? <p className={hintCls}>{f.hint}</p> : null}
    </div>
  );
}

export default function ListForm({ listId, initial, photos }: { listId: string; initial: ListItem[]; photos: Photos }) {
  const def = listById(listId)!; // the page only renders this for a list that exists
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => initial.map((i) => toRow(def, i)));
  const [open, setOpen] = useState<string | null>(null);
  const [bad, setBad] = useState<string | null>(null); // the slug of the row with a problem
  const [dirty, setDirty] = useState(false);
  const undo = useUndo();

  const change = (next: Row[]) => {
    setRows(next);
    setDirty(true);
  };
  const edit = (slug: string, key: string, value: string) => change(rows.map((r) => (r.slug === slug ? { ...r, [key]: value } : r)));
  const add = (start: Record<string, string | number> = {}) => {
    const slug = tempId();
    const row: Row = { slug };
    for (const f of def.fields) row[f.key] = f.type === "choice" ? f.options[0] : f.type === "boolean" ? "false" : f.type === "date" ? new Intl.DateTimeFormat("en-CA").format(new Date()) : "";
    for (const [k, v] of Object.entries(start)) row[k] = String(v);
    change([...rows, row]);
    setOpen(slug);
  };

  // Joins the screen's one Save (see ./SaveGroup.tsx). Returns the problem in plain words, or null when it worked.
  useSavePart(`list-${def.id}`, dirty, async () => {
    const parsed = listSchemaFor(def).safeParse(rows.map((r) => toItem(def, r)));
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      const at = typeof i.path[0] === "number" ? rows[i.path[0]] : undefined;
      if (at) {
        setBad(at.slug);
        setOpen(at.slug);
      }
      const name = at?.[def.nameKey]?.trim();
      return `${name ? `${name}: ` : ""}${i.message}`;
    }
    const r = await saveList(def.id, parsed.data);
    if (!r.ok) return r.message;
    // Items that were new now have their real ids.
    setRows((all) => all.map((row, n) => ({ ...row, slug: r.data.slugs[n] ?? row.slug })));
    setOpen((o) => (o && isTemporary(o) ? null : o));
    setBad(null);
    setDirty(false);
    router.refresh();
    return null;
  });

  const nameField = def.fields.find((f) => f.key === def.nameKey);
  const others = def.fields.filter((f) => f.key !== def.nameKey);
  const full = rows.length >= def.max;

  return (
    <div role="group" aria-label={def.title} className="grid gap-5">
      <p className="max-w-2xl text-sm text-text-soft">{def.intro}</p>
      <ul className="grid gap-3">
        {rows.map((r, i) => {
          const isOpen = open === r.slug;
          const saved = !isTemporary(r.slug);
          const id = `${def.id}-${r.slug}`;
          const place = saved ? listSlot(def, toItem(def, r)) : undefined;
          return (
            <li key={r.slug} className="rounded-xl border border-border">
              <div className="flex items-center gap-4 p-3 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{(r[def.nameKey] ?? "").trim() || `New ${def.itemName}`}</p>
                  <p className="text-xs text-text-soft">{facts(def, r)}</p>
                </div>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.slug)} className={btn}>
                  {isOpen ? "Done" : "Edit"}
                </button>
              </div>
              <Collapse open={isOpen}>
                <div className="grid gap-5 border-t border-border p-4">
                  {nameField ? (
                    <Input
                      id={`${id}-${nameField.key}`}
                      f={nameField}
                      value={r[nameField.key] ?? ""}
                      invalid={bad === r.slug && (r[nameField.key] ?? "").trim() === ""}
                      onChange={(v) => edit(r.slug, nameField.key, v)}
                    />
                  ) : null}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {others.map((f) => (
                      <Input key={f.key} id={`${id}-${f.key}`} f={f} value={r[f.key] ?? ""} onChange={(v) => edit(r.slug, f.key, v)} />
                    ))}
                  </div>

                  {def.photo ? (
                    place ? (
                      <PhotoRows places={[place]} saved={photos} group={`list-${def.id}-${r.slug}`} />
                    ) : (
                      <p className="text-sm text-text-soft">Save the {def.itemName} first, then you can add its photo.</p>
                    )
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    {def.order !== "date" && (
                      <>
                    <button
                      type="button"
                      className={btn}
                      disabled={i === 0}
                      onClick={() => change(move(rows, i, i - 1))}
                      aria-label={`Move ${(r[def.nameKey] ?? "") || `this ${def.itemName}`} up`}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className={btn}
                      disabled={i === rows.length - 1}
                      onClick={() => change(move(rows, i, i + 1))}
                      aria-label={`Move ${(r[def.nameKey] ?? "") || `this ${def.itemName}`} down`}
                    >
                      Move down
                    </button>
                      </>
                    )}
                    <span className="ml-auto">
                      <Remove
                        button
                        what={(r[def.nameKey] ?? "") || `this ${def.itemName}`}
                        onRemove={() => {
                          const before = rows;
                          change(rows.filter((x) => x.slug !== r.slug));
                          undo.offer(`Removed ${(r[def.nameKey] ?? "").trim() || `the ${def.itemName}`}.`, () => change(before));
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
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-soft">
          No {def.itemName}s yet. Use the button below to add the first one.
        </p>
      ) : null}
      {undo.view}
      <div className="flex flex-wrap gap-3">
        {def.add.map((a) => (
          <button key={a.label} type="button" className={btn} disabled={full} onClick={() => add(a.start)}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
