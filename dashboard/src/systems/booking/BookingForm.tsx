"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import SaveBar from "@/kit/SaveBar";
import TimeSelect from "@/kit/TimeSelect";
import { addBookingAction, editBookingAction } from "./actions";
import DayPanel from "./DayPanel";
import type { Hours, Slot } from "./rules";
import { fieldsSchema, type Fields, type Status } from "./schema";
import { area, field, hintCls, labelCls } from "./ui";

// Add a venue booking by hand (a phone call, a walk-in) or change one. The same fields as the website's form. Staff may bend the opening
// hours and the lead time; the server still checks everything again. Beside the fields, the chosen day: who is booked, when it is free, and
// a warning if the time typed runs into a confirmed booking. The one Save bar (the toolbox's) ends the form.
type Draft = Omit<Fields, "guests" | "endDate"> & { guests: string; endDate: string };
export const EMPTY: Fields = { customerName: "", phone: "", email: "", eventType: "", guests: 1, date: "", start: "18:00", end: "21:00", notes: "" };

export default function BookingForm({ initial = EMPTY, edit, hours, slots }: { initial?: Fields; edit?: { id: string; status: Status }; hours: Hours; slots: Slot[] }) {
  const router = useRouter();
  const first = { ...initial, guests: String(initial.guests), endDate: initial.endDate ?? "" };
  const [v, setV] = useState<Draft>(first);
  const [problem, setProblem] = useState<{ field?: string; message: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [key]: e.target.value });
  const changed = JSON.stringify(v) !== JSON.stringify(first);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = fieldsSchema.safeParse({ ...v, guests: Number(v.guests), endDate: v.endDate || undefined });
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      return setProblem({ field: String(i.path[0]), message: i.message });
    }
    setProblem(null);
    start(async () => {
      const r = edit ? await editBookingAction(edit.id, edit.status, parsed.data) : await addBookingAction(parsed.data);
      if (r.ok) router.push(edit ? `/booking/${edit.id}` : "/booking");
      else setProblem({ message: r.message });
    });
  };

  const box = (key: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`b-${key}`} className={labelCls}>
        {label}
      </label>
      <input id={`b-${key}`} className={field} value={v[key]} onChange={set(key)} aria-invalid={problem?.field === key || undefined} aria-describedby={problem?.field === key ? "b-problem" : undefined} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate aria-label={edit ? "Change booking" : "Add booking"}>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:gap-10">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {box("customerName", "Customer name", { autoComplete: "off" })}
            {box("phone", "Phone", { type: "tel", inputMode: "tel", autoComplete: "off" })}
            {box("email", "Email", { type: "email", inputMode: "email", autoComplete: "off" })}
            {box("eventType", "What is the event?")}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {box("date", "Date", { type: "date" })}
            {box("endDate", "Last day (if several)", { type: "date", min: v.date })}
            <div>
              <label htmlFor="b-start" className={labelCls}>
                Starts
              </label>
              <TimeSelect id="b-start" label="Starts" value={v.start} onChange={(t) => setV({ ...v, start: t })} from="06:00" to="23:30" invalid={problem?.field === "start"} />
            </div>
            <div>
              <label htmlFor="b-end" className={labelCls}>
                Ends
              </label>
              <TimeSelect id="b-end" label="Ends" value={v.end} onChange={(t) => setV({ ...v, end: t })} from="06:00" to="23:30" invalid={problem?.field === "end"} />
            </div>
            {box("guests", "Guests", { type: "number", inputMode: "numeric", min: 1 })}
          </div>
          <div>
            <label htmlFor="b-notes" className={labelCls}>
              Notes
            </label>
            <textarea id="b-notes" className={area} maxLength={500} value={v.notes} onChange={set("notes")} />
            <p className={hintCls}>Times are the venue&rsquo;s own clock.</p>
          </div>
        </div>
        <div className="lg:sticky lg:top-6">
          <DayPanel date={v.date} start={v.start} end={v.end} hours={hours} slots={slots} ignoreId={edit?.id} />
        </div>
      </div>
      <SaveBar dirty={changed} pending={pending} label={edit ? "Save changes" : "Add booking"} message={problem ? { text: problem.message, bad: true } : null} />
    </form>
  );
}
