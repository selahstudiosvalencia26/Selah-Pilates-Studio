"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import Select from "@/kit/Select";
import TimeSelect from "@/kit/TimeSelect";
import { saveTimetableAction } from "./actions";
import Collapse from "./Collapse";
import { settingsSchema, type ClassEntry } from "./schema";
import { btn, card, field, labelCls, link, primary } from "./ui";
import type { ListedClass } from "./websiteClasses";

// The week as a board: a column for each day. Press Add under a day, choose the class and time, done. Press a time to change or remove
// it. Each step saves at once, so there is no Save button to forget. Length and price come from the class list, never typed here.
const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" } as const;
const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => n.toString(16).padStart(2, "0")).join("");
const byWeek = (a: ClassEntry, b: ClassEntry) => ORDER.indexOf(a.weekday) - ORDER.indexOf(b.weekday) || a.time.localeCompare(b.time);
const clockWords = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

type Draft = { id: string | null; weekday: ClassEntry["weekday"]; time: string; title: string; spots: string };

export default function TimetableEditor({ initial, classes = [] }: { initial: ClassEntry[]; classes?: ListedClass[] }) {
  const [rows, setRows] = useState(() => [...initial].sort(byWeek));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [problem, setProblem] = useState("");
  const [undo, setUndo] = useState<{ text: string; before: ClassEntry[] } | null>(null);
  const [pending, start] = useTransition();
  const panel = useRef<HTMLDivElement>(null);

  const save = (next: ClassEntry[], done?: () => void) => {
    const parsed = settingsSchema.shape.timetable.safeParse([...next].sort(byWeek));
    if (!parsed.success) return setProblem(parsed.error.issues[0]?.message ?? "Check the details.");
    start(async () => {
      const r = await saveTimetableAction(parsed.data);
      if (!r.ok) return setProblem(r.message);
      setRows(parsed.data);
      setProblem("");
      done?.();
    });
  };

  const open = (next: Draft) => {
    setDraft(next);
    setProblem("");
    requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };
  // Spots follow what this class had last time; a private session starts at 1.
  const spotsFor = (title: string) => String(rows.find((r) => r.title === title)?.capacity ?? (classes.find((c) => c.name === title)?.session ? 1 : 12));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) return setProblem("Choose a class.");
    const found = classes.find((c) => c.name === draft.title);
    const old = rows.find((r) => r.id === draft.id);
    const row: ClassEntry = {
      id: old?.id ?? newId(),
      instructor: old?.instructor ?? "",
      place: old?.place ?? "",
      weekday: draft.weekday,
      time: draft.time,
      title: draft.title.trim(),
      capacity: Number(draft.spots),
      kind: found ? (found.session ? "session" : "class") : (old?.kind ?? "class"),
      minutes: found?.minutes ?? old?.minutes ?? 55,
      price: found ? (found.price ?? undefined) : old?.price,
    };
    save(old ? rows.map((r) => (r.id === old.id ? row : r)) : [...rows, row], () => {
      setDraft(null);
      setUndo(null);
    });
  };

  const remove = () => {
    const old = rows.find((r) => r.id === draft?.id);
    if (!old) return;
    const before = rows;
    save(
      rows.filter((r) => r.id !== old.id),
      () => {
        setDraft(null);
        setUndo({ text: `Removed ${old.title}, ${DAY_NAMES[old.weekday]} ${clockWords(old.time)}.`, before });
      },
    );
  };

  const names = classes.map((c) => c.name);
  if (draft?.title && !names.includes(draft.title)) names.unshift(draft.title);

  return (
    <div role="group" aria-label="Weekly schedule" className="grid gap-5">
      <p className="text-sm text-text-soft">
        Your week. Press <span className="font-medium text-text">Add</span> under a day. Press a time to change it. It saves by itself.
        {classes.length > 0 && process.env.NODE_ENV === "production" && " Names, length and price come from your website's class list."}
        {classes.length > 0 && process.env.NODE_ENV !== "production" && (
          <>
            {" "}
            Names, length and price come from{" "}
            <Link href="/booking/classes" className={link}>
              Classes
            </Link>
            .
          </>
        )}
      </p>

      <div ref={panel}>
        <Collapse open={draft !== null}>
          {draft && (
            <form onSubmit={submit} aria-label={draft.id ? "Change this time" : "Add a time"} className={`${card} grid gap-4 p-4`}>
              <h3 className="text-base font-medium">{draft.id ? "Change this time" : `Add to ${DAY_NAMES[draft.weekday]}`}</h3>
              <div className={`grid gap-4 sm:grid-cols-2 ${draft.id ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                <div>
                  <label htmlFor="w-class" className={labelCls}>
                    Class
                  </label>
                  {classes.length > 0 ? (
                    <Select id="w-class" label="Class" value={draft.title} placeholder="Choose a class" onChange={(title) => (setDraft({ ...draft, title, spots: spotsFor(title) }), setProblem(""))} options={names.map((n) => ({ value: n, label: n }))} />
                  ) : (
                    <input id="w-class" className={field} value={draft.title} maxLength={60} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                  )}
                </div>
                {draft.id && (
                  <div>
                    <label htmlFor="w-day" className={labelCls}>
                      Day
                    </label>
                    <Select id="w-day" label="Day" value={draft.weekday} onChange={(d) => setDraft({ ...draft, weekday: d as ClassEntry["weekday"] })} options={ORDER.map((d) => ({ value: d, label: DAY_NAMES[d] }))} />
                  </div>
                )}
                <div>
                  <label htmlFor="w-time" className={labelCls}>
                    Time
                  </label>
                  <TimeSelect id="w-time" label="Time" value={draft.time} onChange={(time) => setDraft({ ...draft, time })} from="05:00" to="22:00" step={15} />
                </div>
                <div>
                  <label htmlFor="w-spots" className={labelCls}>
                    Slots
                  </label>
                  <input id="w-spots" type="number" inputMode="numeric" min={1} className={field} value={draft.spots} onChange={(e) => setDraft({ ...draft, spots: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className={primary} disabled={pending}>
                  {pending ? "Saving" : draft.id ? "Save" : "Add"}
                </button>
                <button type="button" className={btn} onClick={() => (setDraft(null), setProblem(""))}>
                  Cancel
                </button>
                {draft.id && (
                  <button type="button" className={`${btn} ml-auto text-danger`} disabled={pending} onClick={remove}>
                    Remove
                  </button>
                )}
              </div>
            </form>
          )}
        </Collapse>
      </div>

      <p role="status" aria-live="polite" className={`flex flex-wrap items-center gap-3 text-sm empty:hidden ${problem ? "text-danger" : "text-text-soft"}`}>
        {problem || undo?.text}
        {!problem && undo && (
          <button type="button" className={link} onClick={() => save(undo.before, () => setUndo(null))}>
            Undo
          </button>
        )}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {ORDER.map((d) => {
          const day = rows.filter((r) => r.weekday === d);
          return (
            <li key={d} className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <h3 className="text-sm font-medium">{DAY_NAMES[d]}</h3>
              {day.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`Change ${r.title}, ${DAY_NAMES[d]} ${clockWords(r.time)}`}
                  onClick={() => open({ id: r.id, weekday: r.weekday, time: r.time, title: r.title, spots: String(r.capacity) })}
                  className={`grid rounded-lg border p-3 text-left transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent ${draft?.id === r.id ? "border-accent" : "border-border bg-card"}`}
                >
                  <span className="text-sm font-medium">{clockWords(r.time)}</span>
                  <span className="truncate text-sm">{r.title}</span>
                  <span className="text-xs text-text-soft">{r.capacity === 1 ? "1 slot" : `${r.capacity} slots`}</span>
                </button>
              ))}
              <button type="button" className={`${btn} mt-auto`} aria-label={`Add a class on ${DAY_NAMES[d]}`} onClick={() => open({ id: null, weekday: d, time: "09:00", title: "", spots: "12" })}>
                Add
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
