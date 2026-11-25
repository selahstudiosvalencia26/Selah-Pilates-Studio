"use client";

import { useState } from "react";
import { savePage } from "./actions";
import { useSavePart } from "./SaveGroup";
import { LAYOUTS, type Field, type Section } from "./site/layouts";
import { PAGES, type PageKind } from "./site/pages";
import PhotoRows from "./PhotosForm";
import type { Photos } from "./photoRules";
import { Remove } from "./Remove";
import { useUndo } from "./Undo";
import { btn, field, hintCls, labelCls } from "./ui";

// One page of the website, edited. What is shown comes from ./site/layouts.ts, section by section, in the order of the page. Every
// change stays in this screen until Save. The same checks run again on the server (./actions.ts).
type Json = unknown;

const getIn = (value: Json, path: readonly (string | number)[]): Json =>
  path.reduce<Json>(
    (v, k) => (v == null ? v : (v as Record<string | number, Json>)[k]),
    value,
  );

function setIn(
  value: Json,
  path: readonly (string | number)[],
  next: Json,
): Json {
  if (path.length === 0) return next;
  const [head, ...rest] = path;
  const copy = Array.isArray(value)
    ? [...value]
    : { ...(value as Record<string, Json>) };
  (copy as Record<string | number, Json>)[head] = setIn(
    (value as Record<string | number, Json>)[head],
    rest,
    next,
  );
  return copy;
}

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

export default function PageForm({
  kind,
  initial,
  saved,
}: {
  kind: PageKind;
  initial: unknown;
  saved: Photos;
}) {
  const [value, setValue] = useState<Json>(initial);
  const [badPath, setBadPath] = useState("");
  const [dirty, setDirty] = useState(false);

  const edit = (path: (string | number)[], next: Json) => {
    setValue((v: Json) => setIn(v, path, next));
    setDirty(true);
  };

  // Joins the screen's one Save (see ./SaveGroup.tsx). Returns the problem in plain words, or null when it worked.
  useSavePart(`words-${kind}`, dirty, async () => {
    const parsed = PAGES[kind].schema.safeParse(value);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      const path = i.path.map(String);
      const section = LAYOUTS[kind].find((s) =>
        s.fields.some((f) => f.path.every((k, n) => path[n] === k)),
      );
      setBadPath(path.join("."));
      return `${section?.title ?? "A part of the page"}: ${i.message}`;
    }
    const r = await savePage(kind, parsed.data);
    if (!r.ok) {
      setBadPath(r.field ?? "");
      return r.message;
    }
    setBadPath("");
    setDirty(false);
    return null;
  });

  return (
    <div role="group" aria-label={`${kind} page words`}>
      {LAYOUTS[kind].map((section) => (
        <SectionView
          key={section.title}
          kind={kind}
          section={section}
          value={value}
          error={badPath}
          edit={edit}
          saved={saved}
        />
      ))}
    </div>
  );
}

function SectionView({
  kind,
  section,
  value,
  error,
  edit,
  saved,
}: {
  saved: Photos;
  kind: PageKind;
  section: Section;
  value: Json;
  error: string;
  edit: (path: (string | number)[], next: Json) => void;
}) {
  return (
    <fieldset className="grid gap-5 border-t border-border py-8 first-of-type:border-t-0 first-of-type:pt-2 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
      <legend className="sr-only">{section.title}</legend>
      <div className="lg:pt-1">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
          {section.title}
        </h2>
        <p className="mt-1 max-w-[16rem] text-[13px] leading-relaxed text-text-soft">
          {section.note}
        </p>
      </div>
      <div className="grid min-w-0 content-start gap-5">
        {section.fields.map((f) => (
          <FieldView
            key={f.path.join(".")}
            id={`${kind}-${f.path.join("-")}`}
            def={f}
            value={getIn(value, f.path)}
            bad={error.startsWith(f.path.join("."))}
            onChange={(next) => edit(f.path, next)}
          />
        ))}
        {section.photos && (
          <PhotoRows
            ids={section.photos}
            saved={saved}
            group={`${kind}-${section.title}`}
          />
        )}
      </div>
    </fieldset>
  );
}

type FieldProps = {
  id: string;
  def: Field;
  value: Json;
  bad: boolean;
  onChange: (next: Json) => void;
};

function FieldView({ id, def, value, bad, onChange }: FieldProps) {
  const undo = useUndo();
  const hint = def.hint ? (
    <p id={`${id}-hint`} className={hintCls}>
      {def.hint}
    </p>
  ) : null;
  const describedBy = def.hint ? `${id}-hint` : undefined;

  if (def.type === "text" || def.type === "long") {
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {def.label}
        </label>
        <Box
          id={id}
          long={def.type === "long"}
          value={String(value ?? "")}
          bad={bad}
          describedBy={describedBy}
          onChange={onChange}
        />
        {hint}
      </div>
    );
  }

  const list = (Array.isArray(value) ? value : []) as Json[];
  const name = def.itemName ?? "item";
  const blank: Json =
    def.type === "strings"
      ? ""
      : def.type === "pairs"
        ? { title: "", text: "" }
        : { q: "", a: "" };
  const set = (next: Json[]) => onChange(next);

  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className={labelCls}>
        {def.label}
      </span>
      <ul
        className={`grid gap-3 ${def.type === "strings" ? "" : "xl:grid-cols-2"}`}
      >
        {list.map((item, i) => (
          <li
            key={i}
            className={
              def.type === "strings"
                ? "grid gap-2"
                : "grid gap-2 rounded-lg border border-border bg-card p-3"
            }
          >
            {def.type === "strings" ? (
              <Box
                id={`${id}-${i}`}
                label={`${def.label}, ${i + 1}`}
                long={name === "paragraph"}
                value={String(item ?? "")}
                bad={bad}
                onChange={(v) => set(list.map((x, n) => (n === i ? v : x)))}
              />
            ) : (
              <Pair
                id={`${id}-${i}`}
                item={item as Record<string, string>}
                keys={def.type === "pairs" ? ["title", "text"] : ["q", "a"]}
                labels={
                  def.type === "pairs"
                    ? ["Title", "Line"]
                    : ["Question", "Answer"]
                }
                bad={bad}
                onChange={(next) =>
                  set(list.map((x, n) => (n === i ? next : x)))
                }
              />
            )}
            {!def.fixed && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btn}
                  disabled={i === 0}
                  onClick={() => set(move(list, i, i - 1))}
                  aria-label={`Move ${name} ${i + 1} up`}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className={btn}
                  disabled={i === list.length - 1}
                  onClick={() => set(move(list, i, i + 1))}
                  aria-label={`Move ${name} ${i + 1} down`}
                >
                  Move down
                </button>
                <Remove
                  button
                  what={`${name} ${i + 1}`}
                  onRemove={() => {
                    const before = list;
                    set(list.filter((_, n) => n !== i));
                    undo.offer(`Removed ${name} ${i + 1}.`, () => set(before));
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {undo.view}
      {!def.fixed && (
        <button
          type="button"
          className={`${btn} mt-3`}
          onClick={() => set([...list, blank])}
        >
          Add a {name}
        </button>
      )}
      {hint}
    </div>
  );
}

function Pair({
  id,
  item,
  keys,
  labels,
  bad,
  onChange,
}: {
  id: string;
  item: Record<string, string>;
  keys: [string, string];
  labels: [string, string];
  bad: boolean;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="grid gap-2">
      {keys.map((k, n) => (
        <div key={k}>
          <label
            htmlFor={`${id}-${k}`}
            className="mb-1 block text-xs font-medium text-text-soft"
          >
            {labels[n]}
          </label>
          <Box
            id={`${id}-${k}`}
            long={n === 1}
            value={item?.[k] ?? ""}
            bad={bad}
            onChange={(v) => onChange({ ...item, [k]: v })}
          />
        </div>
      ))}
    </div>
  );
}

function Box({
  id,
  value,
  long,
  bad,
  describedBy,
  label,
  onChange,
}: {
  id: string;
  value: string;
  long?: boolean;
  bad: boolean;
  describedBy?: string;
  label?: string;
  onChange: (v: string) => void;
}) {
  return long ? (
    <textarea
      id={id}
      aria-label={label}
      rows={3}
      value={value}
      aria-invalid={bad && value.trim() === "" ? true : undefined}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value)}
      className={`${field} h-auto min-h-24 py-2.5 leading-relaxed`}
    />
  ) : (
    <input
      id={id}
      aria-label={label}
      value={value}
      aria-invalid={bad && value.trim() === "" ? true : undefined}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value)}
      className={field}
    />
  );
}
