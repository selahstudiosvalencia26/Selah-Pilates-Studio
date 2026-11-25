"use client";

import { useState, useTransition } from "react";
import SaveBar from "@/kit/SaveBar";
import TimeSelect from "@/kit/TimeSelect";
import { saveHours } from "./actions";
import {
  DAY_NAMES,
  DAYS,
  hoursSchema,
  type DayKey,
  type HoursData,
} from "./schema";


// The Opening hours screen: one row for each day, with open and close times or "closed". The footer, Home, Contact, the map
// and Google all follow these.
export default function HoursForm({ initial }: { initial: HoursData }) {
  const [hours, setHours] = useState<HoursData>(initial);
  const [error, setError] = useState<{ day?: string; message: string } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  const edit = (next: HoursData) => {
    setHours(next);
    setSaved(false);
    setDirty(true);
  };
  const change = (d: DayKey, next: HoursData[DayKey]) =>
    edit({ ...hours, [d]: next });
  const copyToWeek = (from: DayKey) => {
    const src = hours[from];
    edit(
      Object.fromEntries(
        DAYS.map((d) => [d, src === "closed" ? "closed" : { ...src }]),
      ) as HoursData,
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const parsed = hoursSchema.safeParse(hours);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      return setError({
        day: String(i.path[0]),
        message: `${DAY_NAMES[i.path[0] as DayKey]}: ${i.message}`,
      });
    }
    setError(null);
    start(async () => {
      const r = await saveHours(parsed.data);
      if (r.ok) {
        setSaved(true);
        setDirty(false);
      } else setError({ message: r.message });
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-6"
      aria-label="Opening hours"
    >
      <p className="max-w-2xl text-sm text-text-soft">
        These show on the Home and Contact pages, in the footer, and in Google
        results.
      </p>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {DAYS.map((d) => {
          const v = hours[d];
          const closed = v === "closed";
          const bad = error?.day === d;
          return (
            <li
              key={d}
              className="grid gap-3 p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center"
            >
              <span className="text-sm font-medium">{DAY_NAMES[d]}</span>
              <div className="flex flex-wrap items-center gap-2">
                {closed ? (
                  <span className="text-sm text-text-soft">Closed all day</span>
                ) : (
                  <>
                    <div className="w-36">
                      <TimeSelect
                        label={`${DAY_NAMES[d]} opens`}
                        invalid={bad}
                        value={v.open}
                        onChange={(t) => change(d, { ...v, open: t })}
                      />
                    </div>
                    <span className="text-sm text-text-soft">to</span>
                    <div className="w-36">
                      <TimeSelect
                        label={`${DAY_NAMES[d]} closes`}
                        invalid={bad}
                        value={v.close}
                        onChange={(t) => change(d, { ...v, close: t })}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() =>
                    change(
                      d,
                      closed ? { open: "08:00", close: "17:00" } : "closed",
                    )
                  }
                  className="font-medium text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {closed ? "Open this day" : "Close this day"}
                </button>
                {!closed && (
                  <button
                    type="button"
                    onClick={() => copyToWeek(d)}
                    className="text-text-soft underline underline-offset-4 hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Copy to every day
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-text-soft">
        Times use the studio&rsquo;s own clock (Philippine time).
      </p>
      <SaveBar dirty={dirty} pending={pending} label="Save hours" message={error ? { text: error.message, bad: true } : saved ? { text: "Saved. Refresh the website to see it." } : null} />
    </form>
  );
}
