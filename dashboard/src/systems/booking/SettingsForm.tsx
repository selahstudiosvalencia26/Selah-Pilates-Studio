"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { parseAmount } from "@/kit/money";
import SaveBar from "@/kit/SaveBar";
import Select from "@/kit/Select";
import TimeSelect from "@/kit/TimeSelect";
import Toggle from "@/kit/Toggle";
import { saveSettingsAction } from "./actions";
import { settingsSchema, type Settings } from "./schema";
import { btn, card, field, hintCls, labelCls, link } from "./ui";
import PayAccountsFields from "./PayAccountsFields";
import PricingFields from "./PricingFields";

// Settings: only what this kind of booking needs. The kind itself (a venue or classes) was chosen when the system was installed and is
// final here (`mdash install booking`), so it is not offered. A venue has opening hours, a lead time and a deposit. A class studio has
// its weekly classes on their own tab. Both have closed dates.
const NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" } as const;
const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const pesos = (centavos: number) => (centavos / 100).toFixed(2).replace(/\.00$/, "");

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [deposit, setDeposit] = useState(pesos(initial.depositAmount));
  const [closed, setClosed] = useState("");
  const [message, setMessage] = useState<{ text: string; bad: boolean } | null>(null);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState({ text: JSON.stringify(initial), deposit: pesos(initial.depositAmount) }); // what is saved now, to tell if anything changed
  const edit = (patch: Partial<Settings>) => (setS({ ...s, ...patch }), setMessage(null));
  const venue = s.mode === "venue";
  const changed = JSON.stringify(s) !== saved.text || deposit !== saved.deposit;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseAmount(deposit);
    if (amount === null) return setMessage({ text: "Enter the deposit like 5000 or 5,000.50.", bad: true });
    const parsed = settingsSchema.safeParse({ ...s, depositAmount: amount });
    if (!parsed.success) return setMessage({ text: parsed.error.issues[0]?.message ?? "Check the settings.", bad: true });
    start(async () => {
      const r = await saveSettingsAction(parsed.data);
      if (r.ok) setSaved({ text: JSON.stringify(s), deposit });
      setMessage(r.ok ? { text: "Saved.", bad: false } : { text: r.message, bad: true });
    });
  };

  const number = (key: "leadDays" | "maxGuests" | "maxDays", label: string, hint: string) => (
    <div>
      <label htmlFor={`s-${key}`} className={labelCls}>
        {label}
      </label>
      <input id={`s-${key}`} type="number" inputMode="numeric" min={0} className={field} value={s[key]} onChange={(e) => edit({ [key]: Number(e.target.value) })} />
      <p className={hintCls}>{hint}</p>
    </div>
  );

  const fullPrice = !venue && s.depositKind === "percent" && s.depositPercent === 100;

  const depositSection = (
          <section className="grid gap-3" aria-labelledby="dep-h">
            <h2 id="dep-h" className="text-base font-medium">
              Deposit
            </h2>
            <Toggle checked={s.depositRequired} onChange={(on) => edit({ depositRequired: on })} label={venue ? "Customers pay a deposit to get the date" : "Customers pay a deposit to keep their slot"} hint={venue ? "The date is theirs only after they pay." : "Add a way to pay below. With none, no deposit is asked."} />
            {s.depositRequired && <Toggle checked={s.holdWhilePaying} onChange={(on) => edit({ holdWhilePaying: on })} label={venue ? "Hold the date while someone is paying" : "Hold the slot while someone is paying"} hint={venue ? "Others see it as on hold until the time to pay ends." : "Nobody else can take it until the time to pay ends."} />}
            {venue && s.depositRequired && (
              <div>
                <label htmlFor="s-when" className={labelCls}>
                  When do customers see how to pay?
                </label>
                <Select id="s-when" label="When do customers see how to pay?" value={s.depositWhen} onChange={(x) => edit({ depositWhen: x as Settings["depositWhen"] })} options={[{ value: "request", label: "As soon as they send a request" }, { value: "confirm", label: "After I confirm the request" }]} />
              </div>
            )}
            {!venue && s.depositRequired && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-kind" className={labelCls}>
                    Ask for
                  </label>
                  <Select id="s-kind" label="Ask for" value={fullPrice ? "full" : s.depositKind} onChange={(x) => edit(x === "full" ? { depositKind: "percent", depositPercent: 100 } : x === "percent" ? { depositKind: "percent", depositPercent: fullPrice ? 50 : s.depositPercent } : { depositKind: "fixed" })} options={[{ value: "full", label: "The full class price" }, { value: "percent", label: "A percentage of the class price" }, { value: "fixed", label: "The same amount every booking" }]} />
                  {fullPrice && <p className="mt-1.5 text-sm text-text-soft">Customers pay the price of the class they book, times the number of people.</p>}
                </div>
                {s.depositKind === "percent" && !fullPrice && (
                  <div>
                    <label htmlFor="s-percent" className={labelCls}>
                      Percentage (%)
                    </label>
                    <input id="s-percent" type="number" inputMode="numeric" min={1} max={100} className={field} value={s.depositPercent} onChange={(e) => edit({ depositPercent: Number(e.target.value) })} />
                  </div>
                )}
              </div>
            )}
            {s.depositRequired && (
              <div className="grid gap-3 sm:grid-cols-2">
                {!fullPrice && (
                <div>
                <label htmlFor="s-deposit" className={labelCls}>
                  {s.depositKind === "percent" && (!venue || s.priceType !== "none") ? "Fixed amount, for bookings with no price (₱)" : "Deposit amount (₱)"}
                </label>
                <input id="s-deposit" inputMode="decimal" className={field} value={deposit} onChange={(e) => (setDeposit(e.target.value), setMessage(null))} />
                {/* 0 quietly turns the deposit off, so it is said out loud: otherwise the QR seems to be broken. */}
                {!(Number(deposit.replace(/,/g, "")) > 0) && !(s.depositKind === "percent" && (!venue || s.priceType !== "none")) && (
                  <p role="status" className="mt-1.5 text-sm text-warning">
                    With 0, customers are not asked to pay and will not see your QR. Type the amount.
                  </p>
                )}
                </div>
                )}
                <div>
                <label htmlFor="s-hours" className={labelCls}>
                  Hours to pay
                </label>
                <input id="s-hours" type="number" inputMode="numeric" min={0} max={720} className={field} value={s.depositHours} onChange={(e) => edit({ depositHours: Number(e.target.value) })} />
                <p className={hintCls}>Counted from when the deposit is asked. After that it shows as overdue. 0 means no limit.</p>
                </div>
              </div>
            )}
          </section>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-8" aria-label="Booking settings">
      <div>
        <label htmlFor="s-venue" className={labelCls}>
          {venue ? "Venue name" : "Studio name"}
        </label>
        <input id="s-venue" className={field} value={s.venue} maxLength={80} onChange={(e) => edit({ venue: e.target.value })} />
      </div>

      {venue ? (
        <>
          <section className="grid gap-3" aria-labelledby="hours-h">
            <h2 id="hours-h" className="text-base font-medium">
              Opening hours
            </h2>
            <ul className={`${card} divide-y divide-border`}>
              {ORDER.map((d) => {
                const v = s.hours[d];
                return (
                  <li key={d} className="flex flex-wrap items-center gap-3 p-3">
                    <span className="w-28 text-sm font-medium">{NAMES[d]}</span>
                    {v === "closed" ? (
                      <span className="text-sm text-text-soft">Closed</span>
                    ) : (
                      <>
                        <div className="w-36"><TimeSelect label={`${NAMES[d]} opens`} value={v.open} onChange={(t) => edit({ hours: { ...s.hours, [d]: { ...v, open: t } } })} /></div>
                        <span className="text-sm text-text-soft">to</span>
                        <div className="w-36"><TimeSelect label={`${NAMES[d]} closes`} value={v.close} onChange={(t) => edit({ hours: { ...s.hours, [d]: { ...v, close: t } } })} /></div>
                      </>
                    )}
                    <button type="button" className={`${link} ml-auto`} onClick={() => edit({ hours: { ...s.hours, [d]: v === "closed" ? { open: "09:00", close: "21:00" } : "closed" } })}>
                      {v === "closed" ? "Open this day" : "Close this day"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {number("leadDays", "Days of notice", "How many days ahead a customer must ask. 0 means same day.")}
            {number("maxGuests", "Most guests", "Requests above this are refused.")}
            {number("maxDays", "Most days in a row", "How many days one booking can cover. 1 means one day only.")}
            <div>
              <label htmlFor="s-step" className={labelCls}>
                Start times every
              </label>
              <Select id="s-step" label="Start times every" value={String(s.slotMinutes)} onChange={(x) => edit({ slotMinutes: Number(x) })} options={[15, 30, 60].map((m) => ({ value: String(m), label: `${m} minutes` }))} />
              <p className={hintCls}>The times a customer can pick from.</p>
            </div>
          </div>
          {depositSection}
        </>
      ) : (
        <>
        <p className="text-sm text-text-soft">
          Add or change your weekly classes in{" "}
          <Link href="/booking/schedule" className={link}>
            Schedule
          </Link>
          .
        </p>
        {depositSection}
        </>
      )}

      {venue && <PricingFields value={s} edit={edit} />}

      {s.depositRequired && <PayAccountsFields value={s.payAccounts} onChange={(payAccounts) => edit({ payAccounts })} />}

      <section className="grid gap-3" aria-labelledby="closed-h">
        <h2 id="closed-h" className="text-base font-medium">
          Closed dates
        </h2>
        <p className={hintCls}>Holidays or days off. {venue ? "Nobody can ask for these dates." : "No classes run on these dates."}</p>
        <div className="flex gap-2">
          <input type="date" aria-label="Add a closed date" className={field} value={closed} onChange={(e) => setClosed(e.target.value)} />
          <button type="button" className={btn} disabled={!closed || s.closedDates.includes(closed)} onClick={() => (edit({ closedDates: [...s.closedDates, closed].sort() }), setClosed(""))}>
            Add
          </button>
        </div>
        {s.closedDates.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {s.closedDates.map((d) => (
              <li key={d}>
                <button type="button" className={btn} aria-label={`Remove ${d}`} onClick={() => edit({ closedDates: s.closedDates.filter((x) => x !== d) })}>
                  {d}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SaveBar dirty={changed} pending={pending} label="Save settings" message={message ? { text: message.text, bad: message.bad } : null} />
    </form>
  );
}
