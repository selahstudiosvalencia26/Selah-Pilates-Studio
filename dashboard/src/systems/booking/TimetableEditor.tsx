"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveTimetableAction } from "./actions";
import ClassTimeDialog, { type Draft } from "./ClassTimeDialog";
import { settingsSchema, type ClassEntry } from "./schema";
import { btn, link } from "./ui";
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

export default function TimetableEditor({ initial, classes = [] }: { initial: ClassEntry[]; classes?: ListedClass[] }) {
  const [rows, setRows] = useState(() => [...initial].sort(byWeek));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [problem, setProblem] = useState("");
  const [undo, setUndo] = useState<{ text: string; before: ClassEntry[] } | null>(null);
  const [pending, start] = useTransition();

  const save = (next: ClassEntry[], done?: () => void) => {
    const parsed = settingsSchema.shape.timetable.safeParse([...next].sort(byWeek));
    if (!parsed.success) return setProblem(parsed.error.issues[0]?.message ?? "Check the details.");
    // Shown at once and saved behind it. If the save is refused the week goes back to how it was, with the reason.
    const before = rows;
    setRows(parsed.data);
    setProblem("");
    done?.();
    start(async () => {
      const r = await saveTimetableAction(parsed.data).catch(() => ({ ok: false as const, message: "Could not save. Check your connection and try again." }));
      if (r.ok) return;
      setRows(before);
      setUndo(null);
      setProblem(r.message);
    });
  };

  const open = (next: Draft) => {
    setDraft(next);
    setProblem("");
  };
  // Spots follow what this class had last time; a private session starts at 1.
  const spotsFor = (title: string) => String(rows.find((r) => r.title === title)?.capacity ?? (classes.find((c) => c.name === title)?.session ? 1 : 12));

  const submit = () => {
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
        Your week. Press <span className="font-medium text-text">Add</span> on a day. Press a time to change it. It saves by itself.
        {classes.length > 0 && (
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

      <ClassTimeDialog
        draft={draft}
        names={names}
        days={ORDER.map((d) => ({ value: d, label: DAY_NAMES[d] }))}
        problem={problem}
        onChange={(next) => (setDraft(next), setProblem(""))}
        onPickClass={(title) => draft && (setDraft({ ...draft, title, spots: spotsFor(title) }), setProblem(""))}
        onSave={submit}
        onRemove={remove}
        onClose={() => (setDraft(null), setProblem(""))}
      />

      <p role="status" aria-live="polite" className={`flex flex-wrap items-center gap-3 text-sm empty:hidden ${problem && !draft ? "text-danger" : "text-text-soft"}`}>
        {draft ? "" : problem || (pending ? "Saving" : undo?.text)}
        {!draft && !problem && undo && (
          <button type="button" className={link} onClick={() => save(undo.before, () => setUndo(null))}>
            Undo
          </button>
        )}
      </p>

      <div className="@container">
      <ul className="grid gap-3 @2xl:grid-cols-7 @2xl:gap-2">
        {ORDER.map((d) => {
          const day = rows.filter((r) => r.weekday === d);
          return (
            <li key={d} className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border p-3 @2xl:flex-col @2xl:flex-nowrap @2xl:items-stretch @2xl:p-2">
              <h3 className="w-full text-sm font-medium @xl:w-24 @2xl:w-full @2xl:truncate @2xl:px-1">{DAY_NAMES[d]}</h3>
              {day.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`Change ${r.title}, ${DAY_NAMES[d]} ${clockWords(r.time)}`}
                  onClick={() => open({ id: r.id, weekday: r.weekday, time: r.time, title: r.title, spots: String(r.capacity) })}
                  className={`grid min-w-0 rounded-lg border p-3 text-left @2xl:p-2 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent ${draft?.id === r.id ? "border-accent" : "border-border bg-card"}`}
                >
                  <span className="text-sm font-medium">{clockWords(r.time)}</span>
                  <span className="truncate text-sm">{r.title}</span>
                  <span className="text-xs text-text-soft">{r.capacity === 1 ? "1 slot" : `${r.capacity} slots`}</span>
                </button>
              ))}
              <button type="button" className={`${btn} ml-auto justify-center @2xl:ml-0 @2xl:mt-auto`} aria-label={`Add a class on ${DAY_NAMES[d]}`} onClick={() => open({ id: null, weekday: d, time: "09:00", title: "", spots: "12" })}>
                Add
              </button>
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
