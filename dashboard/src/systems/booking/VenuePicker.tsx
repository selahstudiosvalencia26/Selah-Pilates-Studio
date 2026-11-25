"use client";

import { useEffect, useState } from "react";
import Icon from "@/kit/Icon";
import Select from "@/kit/Select";
import PickedSent, { type Pay } from "./PickedSent";
import { peso } from "./pricing";
import { addDays, clockWords, weekdayOf, WEEKDAYS } from "./time";
import { btn, card, field, labelCls, pick, primary } from "./ui";

// What a customer of a venue sees (Dan Cafe): a month on the left, the start time and length on the right, then their
// details, then how to pay. The website builds the same steps in its own style, from the same public doors
// (/api/booking/availability and /request), so keep the two alike: a step added to one belongs in the other.
type Day = { starts: string[]; windows: { start: string; end: string }[]; pending: { start: string; end: string }[] };
type Deposit = { amount: number; percent: number | null; hours: number; when: "request" | "confirm" } | null;
type Pricing = { type: "none" | "hour" | "package"; hourPrice: number; packages: { id: string; name: string; hours: number; price: number }[] };
type Props = { today: string; maxGuests: number };

const YEARS_AHEAD = 2;
const NO_PRICES: Pricing = { type: "none", hourPrice: 0, packages: [] };
const EMPTY = { customerName: "", phone: "", email: "", eventType: "", guests: "", notes: "", website: "" };
const format = (d: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const dayWords = (d: string) => format(d, { weekday: "long", day: "numeric", month: "long" });
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const addMonths = (month: string, n: number) => addDays(`${month}-01`, n > 0 ? 32 : -1).slice(0, 7);

async function ask(query: string) {
  const r = await fetch(`/api/booking/availability?${query}`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.message);
  return j.data;
}

export default function VenuePicker({ today, maxGuests }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [off, setOff] = useState<Set<string> | null>(null);
  const [deposit, setDeposit] = useState<Deposit>(null);
  const [pricing, setPricing] = useState<Pricing>(NO_PRICES);
  const [date, setDate] = useState("");
  const [day, setDay] = useState<Day | null>(null);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [packageId, setPackageId] = useState("");
  const [stage, setStage] = useState<"pick" | "details" | "sent">("pick");
  const [pay, setPay] = useState<Pay | null>(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState(EMPTY);
  const [several, setSeveral] = useState(false); // booking more than one day
  const [endDate, setEndDate] = useState("");
  const [maxDays, setMaxDays] = useState(1);
  const [dayPrice, setDayPrice] = useState(0);
  const [partly, setPartly] = useState<Set<string>>(new Set()); // days with something booked or held
  const [pending, setPending] = useState<Set<string>>(new Set()); // days someone is paying for

  useEffect(() => {
    let live = true;
    setOff(null);
    ask(`month=${month}`).then(
      (d) => live && (setOff(new Set<string>(d.unavailable)), setDeposit(d.deposit ?? null), setPricing(d.pricing ?? NO_PRICES), setMaxDays(d.maxDays ?? 1), setDayPrice(d.dayPrice ?? 0), setPartly(new Set<string>(d.partly)), setPending(new Set<string>(d.pending))),
      (e: Error) => live && setProblem(e.message),
    );
    return () => {
      live = false;
    };
  }, [month]);

  useEffect(() => {
    if (!date || several) return;
    let live = true;
    setDay(null);
    ask(`date=${date}`).then((d: Day) => live && setDay(d), (e: Error) => live && setProblem(e.message));
    return () => {
      live = false;
    };
  }, [date, several]);

  // Whole hours (up to 6) that fit in the open stretch after the start. Less than an hour left is the one choice.
  const open = day?.windows.find((w) => from >= w.start && from < w.end);
  const room = open && from ? minutes(open.end) - minutes(from) : 0;
  const whole = [1, 2, 3, 4, 5, 6].map((h) => h * 60).filter((m) => m <= room);
  const lengths = whole.length ? whole : room ? [room] : [];

  // In "several days" the first press is the first day, the next press the last. Every day between must be fully free.
  const between = (a: string, b: string) => {
    const out = [a];
    while (out[out.length - 1] < b) out.push(addDays(out[out.length - 1], 1));
    return out;
  };
  const press = (d: string) => {
    if (!several) return choose(d);
    setProblem("");
    if (!date || endDate || d <= date) return (setDate(d), setEndDate(""));
    const run = between(date, d);
    if (run.length > maxDays) return setProblem(`You can book up to ${maxDays} days in a row.`);
    if (run.some((x) => x.startsWith(month) && (off?.has(x) || partly.has(x)))) return setProblem("A day in between is not free. Pick other days.");
    setEndDate(d);
  };
  const kind = (many: boolean) => (setSeveral(many), setDate(""), setEndDate(""), setFrom(""), setUntil(""), setProblem(""));
  const dayCount = several && date && endDate ? between(date, endDate).length : 0;

  const byPackage = pricing.type === "package";
  const chosenPackage = byPackage ? pricing.packages.find((p) => p.id === packageId) : undefined;
  const price = several ? (dayCount && dayPrice ? dayPrice * dayCount : undefined) : !until ? undefined : byPackage ? chosenPackage?.price : pricing.type === "hour" ? Math.round((pricing.hourPrice * (minutes(until) - minutes(from))) / 60) : undefined;
  const chosen = several ? (dayCount ? `${dayWords(date)} to ${dayWords(endDate)}, ${dayCount} days` : "") : until ? `${dayWords(date)}, ${clockWords(from)} to ${clockWords(until)}` : "";
  const summary = chosen && price !== undefined ? `${chosen}. ${chosenPackage && !several ? `${chosenPackage.name}, ` : ""}${peso(price)}` : chosen;

  const share = deposit?.percent ? `A ${deposit.percent}% deposit${price ? ` (${peso(Math.round((price * deposit.percent) / 100))})` : ""}` : deposit ? `A ${peso(deposit.amount)} deposit` : "";
  const depositWords = !deposit
    ? ""
    : deposit.when === "request"
      ? `${share} secures your date. You will see how to pay after you send. The date is yours once we receive it and confirm.`
      : `${share} secures your date.${deposit.hours ? ` Pay it within ${deposit.hours} hours after we confirm your request.` : ""} The date goes to whoever pays first.`;

  const firstMonth = today.slice(0, 7);
  const lastYear = Number(today.slice(0, 4)) + YEARS_AHEAD;
  const year = month.slice(0, 4);
  const years = Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => String(Number(today.slice(0, 4)) + i));
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`).filter((m) => m >= firstMonth);
  const lead = WEEKDAYS.indexOf(weekdayOf(`${month}-01`));
  const days: string[] = [];
  for (let d = `${month}-01`; d.startsWith(month); d = addDays(d, 1)) days.push(d);

  const choose = (d: string) => (setDate(d), setFrom(""), setUntil(""), setProblem(""));
  const pickYear = (y: string) => setMonth(`${y}-${month.slice(5)}` < firstMonth ? firstMonth : `${y}-${month.slice(5)}`);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setProblem("");
    try {
      // Several days are taken whole; the server sets the real opening and closing times.
      const when = several ? { date, endDate, start: "09:00", end: "21:00" } : { date, start: from, end: until, ...(byPackage ? { packageId } : {}) };
      const body = { ...v, guests: Number(v.guests), ...when };
      const r = await fetch("/api/booking/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j.ok) {
        setPay(j.data?.pay ?? null);
        setStage("sent");
      } else setProblem(j.message);
    } catch {
      setProblem("No connection. Try again.");
    }
    setBusy(false);
  };

  const input = (key: keyof typeof EMPTY, name: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`v-${key}`} className={labelCls}>
        {name}
      </label>
      <input id={`v-${key}`} className={field} value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} {...props} />
    </div>
  );
  const arrow = "grid h-11 w-11 shrink-0 place-items-center rounded-lg text-text-soft transition-colors hover:bg-hover disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent max-sm:hidden";

  if (stage === "sent")
    return <PickedSent summary={summary} pay={pay} depositWords={depositWords} again={() => (setStage("pick"), setDate(""), setEndDate(""), setFrom(""), setUntil(""), setPay(null), setV(EMPTY))} />;

  return (
    <div className={`${card} overflow-hidden`}>
      {stage === "pick" ? (
        <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="p-3 sm:p-5">
            {maxDays > 1 && (
              <div role="group" aria-label="How many days" className="mb-3 grid grid-cols-2 gap-2">
                {[false, true].map((many) => (
                  <button key={String(many)} type="button" aria-pressed={several === many} className={pick(several === many)} onClick={() => kind(many)}>
                    {many ? "Several days" : "One day"}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-3 flex items-center justify-between gap-2">
              <button type="button" aria-label="Previous month" disabled={month <= firstMonth} onClick={() => setMonth(addMonths(month, -1))} className={arrow}>
                <Icon name="chevron-down" className="h-5 w-5 rotate-90" />
              </button>
              <div className="flex min-w-0 flex-1 justify-center gap-2">
                <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
                  <Select label="Month" value={month} onChange={setMonth} options={months.map((m) => ({ value: m, label: format(`${m}-01`, { month: "long" }) }))} />
                </div>
                <div className="w-24 shrink-0 sm:w-28">
                  <Select label="Year" value={year} onChange={pickYear} options={years.map((y) => ({ value: y, label: y }))} />
                </div>
              </div>
              <button type="button" aria-label="Next month" disabled={month >= `${lastYear}-12`} onClick={() => setMonth(addMonths(month, 1))} className={arrow}>
                <Icon name="chevron-down" className="h-5 w-5 -rotate-90" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs capitalize text-text-soft" aria-hidden>
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-2">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid min-h-[17rem] grid-cols-7 content-start gap-y-1 text-center">
              {Array.from({ length: lead }, (_, i) => (
                <span key={`gap-${i}`} />
              ))}
              {days.map((d) => {
                const gone = off === null || off.has(d) || (several && partly.has(d));
                const on = d === date || d === endDate || (!!endDate && d > date && d < endDate);
                const held = pending.has(d);
                return (
                  <button key={d} type="button" disabled={gone} aria-pressed={on} aria-label={held ? `${dayWords(d)}, on hold` : dayWords(d)} onClick={() => press(d)} className={`relative h-11 rounded-lg text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none ${on ? "bg-accent text-accent-contrast" : gone ? "text-text-soft line-through opacity-50" : "hover:bg-hover"}`}>
                    {Number(d.slice(8))}
                    {held && <span aria-hidden className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-warning" />}
                  </button>
                );
              })}
            </div>
            {pending.size > 0 && <p className="mt-2 text-xs text-text-soft">A dot means someone is paying for that day. It is on hold.</p>}
          </div>
          <div className="grid content-start gap-4 border-t border-border p-5 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-medium">{several ? (dayCount ? `${dayCount} days` : date ? "Pick the last day" : "Pick the first day") : date ? dayWords(date) : "Pick a date"}</h3>
            {several && <p className="text-sm text-text-soft">{dayCount ? `${dayWords(date)} to ${dayWords(endDate)}. The venue is yours from opening on the first day to closing on the last.` : `Up to ${maxDays} days in a row. Days with anything booked cannot be picked.`}</p>}
            {!several && day && day.pending.length > 0 && <p className="text-sm text-warning">On hold while someone pays: {day.pending.map((w) => `${clockWords(w.start)} to ${clockWords(w.end)}`).join(", ")}.</p>}
            {!several && !date && <p className="text-sm text-text-soft">Choose a day to see the open times. Crossed out days cannot be picked.</p>}
            {!several && date && !day && !problem && <p className="text-sm text-text-soft">Loading times</p>}
            {!several && day && day.starts.length === 0 && <p className="text-sm text-text-soft">Nothing is open that day. Try another date.</p>}
            {!several && day && day.starts.length > 0 && (
              <div className="grid gap-4 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
                <div>
                  <span className={labelCls}>Start time</span>
                  <Select label="Start time" placeholder="Choose a time" value={from} onChange={(t) => (setFrom(t), setUntil(""))} options={day.starts.map((t) => ({ value: t, label: clockWords(t) }))} />
                </div>
                <div>
                  <span className={labelCls}>{byPackage ? "Package" : "How long"}</span>
                  <Select
                    label={byPackage ? "Package" : "How long"}
                    placeholder={!from ? "Choose a start time first" : byPackage ? "Choose a package" : "Choose how long"}
                    disabled={!from}
                    value={byPackage ? (until ? packageId : "") : until}
                    onChange={(x) => {
                      if (!byPackage) return setUntil(x);
                      const p = pricing.packages.find((y) => y.id === x);
                      if (!p) return;
                      setPackageId(p.id);
                      setUntil(clock(minutes(from) + p.hours * 60));
                    }}
                    options={
                      byPackage
                        ? pricing.packages.filter((p) => p.hours * 60 <= room).map((p) => ({ value: p.id, label: `${p.name}, ${peso(p.price)}, until ${clockWords(clock(minutes(from) + p.hours * 60))}` }))
                        : lengths.map((m) => {
                            const end = clock(minutes(from) + m);
                            const long = m % 60 ? `${m} minutes` : `${m / 60} ${m === 60 ? "hour" : "hours"}`;
                            const cost = pricing.type === "hour" ? `, ${peso(Math.round((pricing.hourPrice * m) / 60))}` : "";
                            return { value: end, label: `${long}, until ${clockWords(end)}${cost}` };
                          })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form id="v-form" className="grid gap-4 p-5" onSubmit={send} aria-label="Your details">
          <div className="grid gap-4 sm:grid-cols-2">
            {input("customerName", "Your name", { autoComplete: "name" })}
            {input("phone", "Phone", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
            {input("email", "Email", { type: "email", inputMode: "email", autoComplete: "email" })}
            {input("eventType", "What is the event", {})}
            {input("guests", `Number of guests (up to ${maxGuests})`, { type: "number", inputMode: "numeric", min: 1, max: maxGuests })}
          </div>
          <div>
            <label htmlFor="v-notes" className={labelCls}>
              Anything else (optional)
            </label>
            <textarea id="v-notes" rows={3} maxLength={500} className={field.replace("h-11", "min-h-24 py-2.5")} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          </div>
          <input name="website" tabIndex={-1} aria-hidden autoComplete="off" className="sr-only" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} />
          {depositWords && <p className="border-l-2 border-accent pl-4 text-sm">{depositWords}</p>}
        </form>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
        <p role="status" aria-live="polite" className={`text-sm ${problem ? "text-danger" : ""}`}>
          {problem || summary || "Choose a date and a time."}
        </p>
        {stage === "pick" ? (
          <button type="button" className={primary} disabled={several ? !dayCount : !until} onClick={() => setStage("details")}>
            Continue
          </button>
        ) : (
          <div className="flex gap-3">
            <button type="button" className={btn} onClick={() => (setStage("pick"), setProblem(""))}>
              Back
            </button>
            <button type="submit" form="v-form" className={primary} disabled={busy}>
              {busy ? "Sending" : "Send request"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
