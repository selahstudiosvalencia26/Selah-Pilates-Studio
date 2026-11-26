"use client";

import { useState, useTransition } from "react";
import { saveTimetableAction } from "./actions";
import ClassTimeDialog, { type Draft } from "./ClassTimeDialog";
import { settingsSchema, type ClassEntry } from "./schema";
import { btn, labelCls } from "./ui";

// The weekly times of one class, set right where the class is: press a time to change or remove it, or add another. The same times
// as on the Schedule tab, saved at once.
const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" } as const;
const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const byWeek = (a: ClassEntry, b: ClassEntry) => ORDER.indexOf(a.weekday) - ORDER.indexOf(b.weekday) || a.time.localeCompare(b.time);
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => n.toString(16).padStart(2, "0")).join("");
const clockWords = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export type ClassFacts = { name: string; session: boolean; minutes: number | null; price: number | null };

export default function ClassTimes({ facts, timetable, onSaved }: { facts: ClassFacts; timetable: ClassEntry[]; onSaved: (next: ClassEntry[]) => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [problem, setProblem] = useState("");
  const [, start] = useTransition();
  const mine = timetable.filter((c) => c.title === facts.name).sort(byWeek);

  const save = (next: ClassEntry[]) => {
    const parsed = settingsSchema.shape.timetable.safeParse([...next].sort(byWeek));
    if (!parsed.success) return setProblem(parsed.error.issues[0]?.message ?? "Check the details.");
    const before = timetable;
    onSaved(parsed.data); // shown at once, put back if the save is refused
    setDraft(null);
    setProblem("");
    start(async () => {
      const r = await saveTimetableAction(parsed.data).catch(() => ({ ok: false as const, message: "Could not save. Check your connection and try again." }));
      if (r.ok) return;
      onSaved(before);
      setProblem(r.message);
    });
  };

  const submit = () => {
    if (!draft) return;
    const old = timetable.find((r) => r.id === draft.id);
    const row: ClassEntry = {
      id: old?.id ?? newId(),
      instructor: old?.instructor ?? "",
      place: old?.place ?? "",
      weekday: draft.weekday,
      time: draft.time,
      title: facts.name,
      capacity: Number(draft.spots),
      kind: facts.session ? "session" : "class",
      minutes: facts.minutes ?? old?.minutes ?? 55,
      price: facts.price ?? old?.price,
    };
    save(old ? timetable.map((r) => (r.id === old.id ? row : r)) : [...timetable, row]);
  };

  const usual = mine.at(-1)?.capacity ?? (facts.session ? 1 : 12);

  return (
    <div className="grid gap-2">
      <p className={labelCls}>Class times each week</p>
      <div className="flex flex-wrap gap-2">
        {mine.map((r) => (
          <button key={r.id} type="button" className={btn} aria-label={`Change ${facts.name}, ${DAY_NAMES[r.weekday]} ${clockWords(r.time)}`} onClick={() => (setProblem(""), setDraft({ id: r.id, weekday: r.weekday, time: r.time, title: facts.name, spots: String(r.capacity) }))}>
            {DAY_NAMES[r.weekday].slice(0, 3)} {clockWords(r.time)}
            <span className="ml-1.5 text-text-soft">· {r.capacity} {r.capacity === 1 ? "slot" : "slots"}</span>
          </button>
        ))}
        <button type="button" className={`${btn} border-dashed`} onClick={() => (setProblem(""), setDraft({ id: null, weekday: "mon", time: "09:00", title: facts.name, spots: String(usual) }))}>
          Add a time
        </button>
      </div>
      <p className="text-sm text-text-soft">{mine.length === 0 ? "No times yet, so customers cannot book this class." : "Press a time to change or remove it. Times save by themselves."}</p>
      {problem && !draft && (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
      <ClassTimeDialog
        draft={draft}
        pickDay
        names={[facts.name]}
        days={ORDER.map((d) => ({ value: d, label: DAY_NAMES[d] }))}
        problem={problem}
        onChange={(next) => (setDraft(next), setProblem(""))}
        onPickClass={() => {}}
        onSave={submit}
        onRemove={() => draft?.id && save(timetable.filter((r) => r.id !== draft.id))}
        onClose={() => (setDraft(null), setProblem(""))}
      />
    </div>
  );
}
