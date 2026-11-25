"use client";

import { useEffect, useState } from "react";
import PickedSent, { type Pay } from "./PickedSent";
import { peso } from "./pricing";
import { addDays, clockWords, localParts } from "./time";
import { btn, card, field, labelCls, pick, primary } from "./ui";

// What a customer of a class studio sees (Selah): a strip of days, then that day's classes with the teacher, the room and a Book button.
// It uses only the public doors, so a client's website can build the same screen in its own style.
type Class = { key: string; title: string; instructor: string; place: string; startsAt: string; endsAt: string; capacity: number; spotsLeft: number; price: number | null };

const DAYS_SHOWN = 14;
const short = (d: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const long = (d: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

export default function ClassPicker({ today, zone }: { today: string; zone: string }) {
  const [classes, setClasses] = useState<Class[] | null>(null);
  const [date, setDate] = useState(today);
  const [open, setOpen] = useState("");
  const [done, setDone] = useState("");
  const [pay, setPay] = useState<Pay | null>(null); // how to pay the deposit, given back after booking
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({ customerName: "", phone: "", email: "", spots: "1", website: "" });

  const load = () =>
    fetch(`/api/booking/availability?from=${today}&days=${DAYS_SHOWN}`)
      .then((r) => r.json())
      .then((j) => (j.ok ? setClasses(j.data.classes) : setProblem(j.message)))
      .catch(() => setProblem("No connection. Try again."));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const strip = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i));
  const todays = (classes ?? []).filter((c) => localParts(c.startsAt, zone).date === date);

  const book = async (key: string) => {
    setBusy(true);
    setProblem("");
    try {
      const r = await fetch("/api/booking/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, sessionKey: key, spots: Number(v.spots) }) });
      const j = await r.json();
      if (j.ok) {
        setDone(key);
        setPay(j.data?.pay ?? null);
        setOpen("");
        load();
      } else setProblem(j.message);
    } catch {
      setProblem("No connection. Try again.");
    }
    setBusy(false);
  };
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <div className="grid gap-5">
      <div role="group" aria-label="Choose a day" className="scroll-quiet -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {strip.map((d) => (
          <button key={d} type="button" aria-pressed={d === date} aria-label={long(d)} onClick={() => (setDate(d), setOpen(""), setProblem(""))} className={`${pick(d === date)} h-16 min-w-14 flex-[1_0_3.5rem] flex-col gap-0.5 px-2`}>
            <span className="text-[11px] opacity-80">{short(d)}</span>
            <span className="text-base">{Number(d.slice(8))}</span>
          </button>
        ))}
      </div>
      <h3 className="text-sm font-medium">{long(date)}</h3>
      {done && !pay && <p role="status" className="text-sm text-success">You are booked. See you in class.</p>}
      {done && pay && <PickedSent spot summary="Your slot is on hold" pay={pay} depositWords="" again={() => (setDone(""), setPay(null))} />}
      {problem && <p role="alert" className="text-sm text-danger">{problem}</p>}
      {classes === null && !problem && <p className="text-sm text-text-soft">Loading classes</p>}
      {classes && todays.length === 0 && <p className="text-sm text-text-soft">No classes this day. Try another day.</p>}
      <ul className={`${card} divide-y divide-border empty:hidden`}>
        {todays.map((c) => (
          <li key={c.key} className="grid gap-3 p-4">
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3">
              <span className="text-sm">
                {clockWords(localParts(c.startsAt, zone).time)}
                <span className="block text-xs text-text-soft">{Math.round((new Date(c.endsAt).getTime() - new Date(c.startsAt).getTime()) / 60000)} min</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.title}</span>
                <span className="block truncate text-xs text-text-soft">
                  {c.instructor ? `With ${c.instructor}` : ""}
                  {c.instructor && c.place ? " · " : ""}
                  {c.place}
                </span>
                <span className={`block text-xs ${c.spotsLeft === 0 ? "text-danger" : "text-text-soft"}`}>{c.spotsLeft === 0 ? "Full" : `${c.spotsLeft} ${c.spotsLeft === 1 ? "slot" : "slots"} left`}{c.price ? ` · ${peso(c.price)}` : ""}</span>
              </span>
              <button type="button" className={btn} disabled={c.spotsLeft === 0} aria-expanded={open === c.key} onClick={() => (setOpen(open === c.key ? "" : c.key), setDone(""), setProblem(""))}>
                Book
              </button>
            </div>
            {open === c.key && (
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => (e.preventDefault(), book(c.key))} aria-label={`Book ${c.title}`}>
                <div>
                  <label htmlFor={`n-${c.key}`} className={labelCls}>Your name</label>
                  <input id={`n-${c.key}`} className={field} value={v.customerName} onChange={set("customerName")} autoComplete="name" />
                </div>
                <div>
                  <label htmlFor={`p-${c.key}`} className={labelCls}>Phone</label>
                  <input id={`p-${c.key}`} type="tel" inputMode="tel" className={field} value={v.phone} onChange={set("phone")} autoComplete="tel" />
                </div>
                <div>
                  <label htmlFor={`e-${c.key}`} className={labelCls}>Email</label>
                  <input id={`e-${c.key}`} type="email" inputMode="email" className={field} value={v.email} onChange={set("email")} autoComplete="email" />
                </div>
                <div>
                  <label htmlFor={`s-${c.key}`} className={labelCls}>Slots</label>
                  <input id={`s-${c.key}`} type="number" inputMode="numeric" min={1} max={Math.min(20, c.spotsLeft)} className={field} value={v.spots} onChange={set("spots")} />
                </div>
                <input name="website" tabIndex={-1} aria-hidden autoComplete="off" className="sr-only" value={v.website} onChange={set("website")} />
                <div className="sm:col-span-2">
                  <button type="submit" className={primary} disabled={busy}>{busy ? "Booking" : "Confirm booking"}</button>
                </div>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
