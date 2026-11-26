"use client";

import Dialog from "@/kit/Dialog";
import type { ClassEntry } from "./schema";
import { btn, field, labelCls, primary } from "./ui";

// Add or change one class time, in a window over the week. Everything is a button to press: the class, the hour, the minutes, and
// minus and plus for slots. Nothing to open or scroll through, and nothing to type.
export type Draft = { id: string | null; weekday: ClassEntry["weekday"]; time: string; title: string; spots: string };

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 10 PM
const MINUTES = ["00", "15", "30", "45"];
const hourWords = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
const two = (n: number) => String(n).padStart(2, "0");

const chip = (on: boolean) =>
  `min-h-10 rounded-lg border px-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${on ? "border-accent bg-accent font-medium text-accent-contrast" : "border-border-strong hover:bg-hover"}`;

type Props = {
  draft: Draft | null;
  names: string[];
  days: { value: ClassEntry["weekday"]; label: string }[];
  problem: string;
  onChange: (next: Draft) => void;
  onPickClass: (title: string) => void;
  onSave: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export default function ClassTimeDialog({ draft, names, days, problem, onChange, onPickClass, onSave, onRemove, onClose }: Props) {
  if (!draft) return null;
  const [hour, minute] = draft.time.split(":");
  const day = days.find((d) => d.value === draft.weekday)?.label ?? "";
  const spots = Number(draft.spots) || 0;
  const setSpots = (n: number) => onChange({ ...draft, spots: String(Math.max(1, n)) });

  return (
    <Dialog
      open
      onClose={onClose}
      title={draft.id ? "Change this time" : `Add to ${day}`}
      actions={
        <>
          {draft.id && (
            <button type="button" className={`${btn} mr-auto text-danger`} onClick={onRemove}>
              Remove
            </button>
          )}
          <button type="button" className={btn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primary} disabled={!draft.title.trim()} onClick={onSave}>
            {draft.id ? "Save" : `Add ${hourWords(Number(hour)).replace(" ", `:${minute} `)}`}
          </button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Class" className="grid gap-2">
        <p className={labelCls}>Class</p>
        {names.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {names.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={draft.title === n} onClick={() => onPickClass(n)} className={chip(draft.title === n)}>
                {n}
              </button>
            ))}
          </div>
        ) : (
          <input aria-label="Class name" className={field} value={draft.title} maxLength={60} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
        )}
      </div>

      {draft.id && (
        <div role="radiogroup" aria-label="Day" className="grid gap-2">
          <p className={labelCls}>Day</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {days.map((d) => (
              <button key={d.value} type="button" role="radio" aria-checked={draft.weekday === d.value} aria-label={d.label} onClick={() => onChange({ ...draft, weekday: d.value })} className={chip(draft.weekday === d.value)}>
                {d.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-1.5">
        <p className={labelCls}>Time</p>
        <div role="radiogroup" aria-label="Hour" className="grid grid-cols-4 gap-1.5 sm:grid-cols-9">
          {HOURS.map((h) => (
            <button key={h} type="button" role="radio" aria-checked={Number(hour) === h} onClick={() => onChange({ ...draft, time: `${two(h)}:${minute}` })} className={`${chip(Number(hour) === h)} grid content-center justify-items-center leading-tight`}>
              <span>{h % 12 || 12} </span>
              <span className="text-xs">{h < 12 ? "AM" : "PM"}</span>
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Minutes" className="grid grid-cols-4 gap-2">
          {MINUTES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={minute === m} onClick={() => onChange({ ...draft, time: `${hour}:${m}` })} className={chip(minute === m)}>
              :{m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="w-spots" className={labelCls}>
          Slots
        </label>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="One slot less" className={`${chip(false)} w-11`} onClick={() => setSpots(spots - 1)}>
            −
          </button>
          <input id="w-spots" type="number" inputMode="numeric" min={1} className={`${field} !w-20 text-center`} value={draft.spots} onChange={(e) => onChange({ ...draft, spots: e.target.value })} />
          <button type="button" aria-label="One slot more" className={`${chip(false)} w-11`} onClick={() => setSpots(spots + 1)}>
            +
          </button>
        </div>
      </div>

      {problem && (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
    </Dialog>
  );
}
