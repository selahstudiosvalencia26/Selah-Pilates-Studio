"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Button, LinkButton } from "@/components/Button";
import PayProof from "@/components/PayProof";
import { BOOKING_RULES } from "@/content/rules";
import Link from "next/link";
import { bookingApi } from "@/content/booking";
import { formatPhoneBox } from "@/lib/phone";

// Booking inside the website. The open classes come from the studio's dashboard and the booking is sent there, so the rules (spots,
// closed dates, deposit) live in one place. With a deposit, the spot is on hold until the studio records the money.

type Slot = {
  key: string;
  title: string;
  instructor: string;
  startsAt: string;
  endsAt: string;
  spotsLeft: number;
  price: number | null; // centavos
};
type Deposit = {
  amount: number;
  percent: number | null;
  hours: number;
} | null;
type Pay = {
  amount: number;
  payBy: string | null;
  accounts: { label: string; name: string; number: string; qr: string }[];
  id?: string; // for attaching the receipt
  code?: string;
};

const WEEKS = 3; // this week and the next two, each Monday to Sunday
const ZONE = "Asia/Manila";
const peso = (centavos: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: centavos % 100 ? 2 : 0,
  }).format(centavos / 100);
const fmt = (options: Intl.DateTimeFormatOptions, iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: ZONE, ...options }).format(
    new Date(iso),
  );
const dayOf = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(new Date(iso));
const clock = (iso: string) =>
  fmt({ hour: "numeric", minute: "2-digit" }, iso);
const todayHere = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(new Date());
// Today and the Monday that starts this week. A day is read at noon (04:00 UTC), so no clock change can move it.
const thisWeek = () => {
  const today = todayHere();
  const noon = Date.parse(`${today}T04:00:00Z`);
  const sinceMonday = (new Date(noon).getUTCDay() + 6) % 7;
  return { today, monday: noon - sinceMonday * 86_400_000, sinceMonday };
};
const longDay = (iso: string) =>
  fmt({ weekday: "long", month: "long", day: "numeric" }, iso);

const field =
  "mt-2 block min-h-14 w-full rounded-2xl bg-page px-5 text-lg outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-ink";
const enter =
  "transition-[opacity,translate] duration-200 starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none";
const chip = (on: boolean) =>
  `min-h-11 shrink-0 rounded-full border px-5 text-base transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${on ? "border-ink bg-ink text-page" : "border-line hover:border-ink"}`;
const arrow =
  "inline-flex size-11 items-center justify-center rounded-full border border-line transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-30";
const empty = {
  customerName: "",
  phone: "",
  email: "",
  spots: "1",
  notes: "",
  website: "",
};

// A returning customer's details are kept on their own device only, so next time booking is one tap. Storage can be blocked
// (private window), so every use is wrapped and the form works without it.
const REMEMBER = "selah-booker";
type Booker = { customerName: string; phone: string; email: string };
const recall = (): Booker | null => {
  try {
    const v = JSON.parse(localStorage.getItem(REMEMBER) ?? "null");
    return v?.customerName && v?.phone
      ? { customerName: v.customerName, phone: v.phone, email: v.email ?? "" }
      : null;
  } catch {
    return null;
  }
};
const remember = (b: Booker | null) => {
  try {
    if (b) localStorage.setItem(REMEMBER, JSON.stringify(b));
    else localStorage.removeItem(REMEMBER);
  } catch {
    /* not available: nothing to remember */
  }
};

export function OnlineBooking({
  picked,
  messenger,
}: {
  picked: string;
  messenger: string | null;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [deposit, setDeposit] = useState<Deposit>(null);
  const [offline, setOffline] = useState(false);
  const [only, setOnly] = useState(picked);
  const [day, setDay] = useState("");
  const [week, setWeek] = useState<number | null>(null);
  const [key, setKey] = useState("");
  const [v, setV] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [known, setKnown] = useState(false); // details remembered from last time: no typing needed
  const [askEmail, setAskEmail] = useState(false); // remembered, but without an email
  const [more, setMore] = useState(false); // the optional boxes
  const [keep, setKeep] = useState(true);
  const [copied, setCopied] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const [problem, setProblem] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState<{ slot: Slot; pay: Pay | null; ref?: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const { today, sinceMonday } = thisWeek();
      const r = await fetch(
        `${bookingApi}/api/booking/availability?from=${today}&days=${WEEKS * 7 - sinceMonday}`,
      );
      const j = await r.json();
      if (!j.ok) return setOffline(true);
      setSlots(j.data.classes);
      setDeposit(j.data.deposit ?? null);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);
  useEffect(() => {
    load();
    const saved = recall();
    if (saved) {
      setV((now) => ({ ...now, ...saved }));
      setKnown(true);
      setAskEmail(!saved.email);
    }
  }, [load]);
  // Once booked, the answer is brought to the top of the screen, below the menu, so it is read from its first line. The classes
  // are loaded again right after, which can move the page, so it is done on the next frame too.
  useEffect(() => {
    if (!sent) return;
    const show = () =>
      done.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    const frame = requestAnimationFrame(show);
    done.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(frame);
  }, [sent]);
  // Pressing Book brings the form into view and puts the cursor in the first box that needs typing.
  useEffect(() => {
    if (!key) return;
    const f = form.current;
    if (!f) return;
    f.scrollIntoView({ block: "nearest", behavior: "smooth" });
    f.querySelector<HTMLInputElement>('input[name="customerName"]')?.focus({
      preventScroll: true,
    });
  }, [key]);

  // Said plainly, and promising nothing the studio cannot do yet.
  const emailWhy = <p className="mt-2 text-base text-muted">So the studio can reach you about your booking, such as a change of time or your payment.</p>;

  const contact = (
    <LinkButton href="/contact" variant="dark" className="mt-6">
      Send us a message
    </LinkButton>
  );
  const notice = (title: string, text: string) => (
    <div role="status" className={`rounded-panel bg-sand p-8 sm:p-10 ${enter}`}>
      <p className="font-serif text-3xl">{title}</p>
      <p className="mt-3 max-w-xl text-muted">{text}</p>
      {contact}
    </div>
  );

  if (offline || !bookingApi)
    return notice(
      "Online booking is not available right now.",
      "Send us a message with the class, day and time you would like.",
    );
  if (!slots)
    return (
      <p role="status" className="text-muted">
        Loading classes
      </p>
    );
  if (slots.length === 0)
    return notice(
      "No classes are open for booking yet.",
      "Send us a message and we will tell you the next class.",
    );

  if (sent) {
    const { slot, pay, ref } = sent;
    const when = `${slot.title}, ${longDay(slot.startsAt)} at ${clock(slot.startsAt)}`;
    const due = pay?.payBy
      ? fmt(
          { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" },
          pay.payBy,
        )
      : "";
    return (
      <div
        ref={done}
        tabIndex={-1}
        role="status"
        className={`scroll-mt-28 rounded-panel bg-sand p-7 outline-none sm:scroll-mt-60 sm:p-10 ${enter}`}
      >
        <p className="font-serif text-3xl sm:text-4xl">
          {pay
            ? `Pay ${peso(pay.amount)} to keep your slot.`
            : "You are booked. See you in class."}
        </p>
        {ref && (
          <p className="mt-3 text-lg">
            Booking ID <span className="font-medium tracking-[0.12em]">{ref}</span>
          </p>
        )}
        <p className="mt-3 text-muted">
          {when}.
          {pay &&
            ` Your slot is on hold${due ? ` until ${due}` : ""}. It is confirmed once we receive your payment.`}
        </p>
        {pay && (
          <>
            <ul
              className={`mt-8 grid gap-4 ${pay.accounts.length > 1 ? "lg:grid-cols-2" : ""}`}
            >
              {pay.accounts.map((a) => (
                <li
                  key={`${a.label}-${a.number}`}
                  className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-page p-7 max-sm:justify-center max-sm:text-center"
                >
                  <div>
                    <p className="text-base text-muted">{a.label}</p>
                    {a.number && (
                      <p className="font-serif text-3xl tabular-nums">
                        {a.number}
                      </p>
                    )}
                    <p>{a.name}</p>
                    {a.number && (
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              a.number.replace(/\s/g, ""),
                            );
                            setCopied(a.number);
                          } catch {
                            setCopied("");
                          }
                        }}
                      >
                        {copied === a.number ? "Copied" : "Copy number"}
                      </Button>
                    )}
                  </div>
                  {a.qr && (
                    // eslint-disable-next-line @next/next/no-img-element -- the studio's QR picture, sent with the answer
                    <img
                      src={a.qr}
                      alt={`${a.label} QR code`}
                      className="size-52 max-w-full object-contain"
                    />
                  )}
                </li>
              ))}
            </ul>
            {pay.id && pay.code && <PayProof id={pay.id} code={pay.code} />}
            <p className="mt-6 text-muted">
              You can also send it
              {messenger ? (
                <>
                  {" "}
                  on{" "}
                  <a
                    href={messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    Messenger
                  </a>
                </>
              ) : (
                " to us in a message"
              )}
              .
            </p>
          </>
        )}
        <Button
          variant="dark"
          className="mt-8"
          onClick={() => {
            setSent(null);
            setKey("");
            const saved = recall();
            setV({ ...empty, ...saved });
            setKnown(Boolean(saved));
            setAskEmail(Boolean(saved) && !saved?.email);
          }}
        >
          Book another class
        </Button>
      </div>
    );
  }

  const names = [...new Set(slots.map((s) => s.title))];
  const match = names.find((n) => n.toLowerCase() === only.toLowerCase());
  const shown = match ? slots.filter((s) => s.title === match) : slots;
  const has = new Set(shown.map((s) => dayOf(s.startsAt)));
  // Whole weeks, Monday to Sunday. Days already gone are shown, greyed out.
  const { today, monday } = thisWeek();
  const all = Array.from({ length: WEEKS * 7 }, (_, i) =>
    dayOf(new Date(monday + i * 86_400_000).toISOString()),
  );
  const first = all.find((d) => d >= today && has.has(d)) ?? today;
  const activeDay = all.includes(day) && day >= today ? day : first;
  // The week on screen: the one chosen with the arrows, otherwise the one holding the picked day.
  const page = week ?? Math.floor(all.indexOf(activeDay) / 7);
  const days = all.slice(page * 7, page * 7 + 7);
  const times = shown.filter((s) => dayOf(s.startsAt) === activeDay);
  const turn = (to: number) => {
    const open = all.slice(to * 7, to * 7 + 7).filter((d) => d >= today);
    setWeek(to);
    setDay(open.find((d) => has.has(d)) ?? open[0] ?? "");
    setKey("");
  };
  const slot = times.find((s) => s.key === key) ?? null;
  const spots = Number(v.spots) || 1;
  const price = slot?.price ? slot.price * spots : null;
  const ask = !deposit
    ? 0
    : deposit.percent && price
      ? Math.round((price * deposit.percent) / 100)
      : deposit.amount;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    setBusy(true);
    setProblem("");
    try {
      const r = await fetch(`${bookingApi}/api/booking/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, spots, sessionKey: slot.key, agreed }),
      });
      const j = await r.json();
      if (j.ok) {
        remember(
          keep
            ? { customerName: v.customerName, phone: v.phone, email: v.email }
            : null,
        );
        setSent({ slot, pay: j.data?.pay ?? null, ref: j.data?.ref });
        setAgreed(false);
        load();
      } else {
        setProblem(j.message);
        load();
      }
    } catch {
      setProblem("We could not send it. Check your connection and try again.");
    }
    setBusy(false);
  };

  const input = (
    name: "customerName" | "phone" | "email",
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <label className="block text-base">
      {label}
      <input
        name={name}
        value={v[name]}
        onChange={(e) =>
          setV({
            ...v,
            [name]:
              name === "phone" ? formatPhoneBox(e.target) : e.target.value,
          })
        }
        className={field}
        {...props}
      />
    </label>
  );
  const most = slot ? Math.min(20, slot.spotsLeft) : 1;
  const step =
    "inline-flex size-11 items-center justify-center rounded-full bg-page text-xl focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-35";

  const details = slot && (
    <form
      ref={form}
      onSubmit={send}
      aria-label="Your details"
      className={`mb-6 grid scroll-mb-6 gap-5 rounded-panel bg-sand p-5 sm:p-8 ${enter}`}
    >
      <p className="font-serif text-2xl">
        {slot.title}, {longDay(slot.startsAt)} at {clock(slot.startsAt)}
      </p>

      {known ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-page px-5 py-3">
          <p className="min-w-0">
            <span className="block truncate text-lg">{v.customerName}</span>
            <span className="block text-base text-muted">{v.phone}</span>
          </p>
          <button
            type="button"
            className="min-h-11 text-base underline underline-offset-4"
            onClick={() => {
              remember(null);
              setKnown(false);
              setV({ ...empty, spots: v.spots });
            }}
          >
            Not you?
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {input("customerName", "Your name", {
            required: true,
            autoComplete: "name",
          })}
          {input("phone", "Phone number", {
            required: true,
            type: "tel",
            inputMode: "tel",
            autoComplete: "tel",
            placeholder: "0917 123 4567",
          })}
          <div className="sm:col-span-2">
            {input("email", "Email", {
              required: true,
              type: "email",
              autoComplete: "email",
              placeholder: "you@example.com",
            })}
            {emailWhy}
          </div>
        </div>
      )}
      {/* Someone remembered from before the email was asked still gives it once. */}
      {known && askEmail && (
        <div>
          {input("email", "Email", {
            required: true,
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          })}
          {emailWhy}
        </div>
      )}

      {most > 1 && (
        <div
          role="group"
          aria-label="How many people"
          className="flex items-center justify-between gap-4 sm:justify-start"
        >
          <span className="text-base">How many people?</span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              aria-label="One person less"
              className={step}
              disabled={spots <= 1}
              onClick={() => setV({ ...v, spots: String(spots - 1) })}
            >
              −
            </button>
            <output className="w-6 text-center text-xl">{spots}</output>
            <button
              type="button"
              aria-label="One person more"
              className={step}
              disabled={spots >= most}
              onClick={() => setV({ ...v, spots: String(spots + 1) })}
            >
              +
            </button>
          </span>
        </div>
      )}

      {/* Hidden from people. A bot that fills it is ignored by the dashboard. */}
      <input
        name="website"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        className="sr-only"
        value={v.website}
        onChange={(e) => setV({ ...v, website: e.target.value })}
      />

      {more ? (
        <div className={`grid gap-4 ${enter}`}>
          <label className="block text-base">
            Note (optional)
            <textarea
              rows={2}
              maxLength={500}
              value={v.notes}
              onChange={(e) => setV({ ...v, notes: e.target.value })}
              className={`${field} py-3`}
            />
          </label>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 justify-self-start text-base underline underline-offset-4"
          onClick={() => setMore(true)}
        >
          Add a note (optional)
        </button>
      )}

      {ask > 0 && (
        <p className="text-base">
          Pay {peso(ask)} {price !== null && ask < price ? `now and ${peso(price - ask)} at the studio` : "to keep your slot"}. You will see how to pay next
          {deposit?.hours ? `, within ${deposit.hours} hours` : ""}.
        </p>
      )}

      {!known && (
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input
            type="checkbox"
            checked={keep}
            onChange={(e) => setKeep(e.target.checked)}
            className="size-5 accent-ink"
          />
          Remember me on this phone
        </label>
      )}

      <div className="rounded-3xl bg-page p-6">
        <p className="font-serif text-2xl">Before you book</p>
        <ul className="mt-3 grid list-disc gap-2 pl-5 text-base text-muted">
          {BOOKING_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <label className="mt-4 flex min-h-11 items-start gap-3 text-base">
          <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-5 shrink-0 accent-ink" />
          <span>
            I agree to these rules and the{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-4">
              privacy notice
            </Link>
            .
          </span>
        </label>
      </div>

      <p role="alert" className="text-base text-red-800 empty:hidden">
        {problem}
      </p>
      <Button
        type="submit"
        variant="dark"
        className="w-full sm:w-auto sm:justify-self-start"
        disabled={busy}
      >
        {busy
          ? "Booking"
          : "Confirm booking"}
      </Button>
    </form>
  );

  return (
    <div className="grid gap-10">
      {names.length > 1 && (
        <div role="group" aria-label="Class" className="flex flex-wrap gap-2">
          {["", ...names].map((n) => (
            <button
              key={n || "all"}
              type="button"
              aria-pressed={(match ?? "") === n}
              onClick={() => {
                setOnly(n);
                setKey("");
              }}
              className={chip((match ?? "") === n)}
            >
              {n || "All classes"}
            </button>
          ))}
        </div>
      )}
      {picked && !match && only === picked && (
        <p className="text-muted">
          {picked} has no open time in the next two weeks. These classes do.
        </p>
      )}

      <div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            aria-label="Previous week"
            disabled={page === 0}
            onClick={() => turn(page - 1)}
            className={arrow}
          >
            <CaretLeft aria-hidden="true" size={20} />
          </button>
          <p className="font-serif text-2xl" aria-live="polite">
            {fmt(
              { month: "long", year: "numeric" },
              `${days.includes(activeDay) ? activeDay : days[0]}T04:00:00Z`,
            )}
          </p>
          <button
            type="button"
            aria-label="Next week"
            disabled={page >= WEEKS - 1}
            onClick={() => turn(page + 1)}
            className={arrow}
          >
            <CaretRight aria-hidden="true" size={20} />
          </button>
        </div>
        <div role="group" aria-label="Day" className="mt-4 grid grid-cols-7">
          {days.map((d) => {
            const iso = `${d}T04:00:00Z`;
            const on = d === activeDay;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                disabled={d < today}
                aria-label={`${longDay(iso)}${has.has(d) ? "" : ", no classes"}`}
                onClick={() => {
                  setDay(d);
                  setKey("");
                }}
                className="group flex flex-col items-center gap-2 py-2 focus-visible:outline-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-35"
              >
                <span className="text-base text-muted">
                  {fmt({ weekday: "short" }, iso)}
                </span>
                <span
                  className={`inline-flex size-11 items-center justify-center rounded-full text-xl transition-colors duration-200 ${on ? "bg-ink text-page" : has.has(d) ? "bg-sand group-hover:bg-stone" : "text-muted group-hover:bg-sand"}`}
                >
                  {fmt({ day: "numeric" }, iso)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeDay} className={enter}>
        <p className="border-b border-line pb-3 text-base font-medium">
          {longDay(`${activeDay}T04:00:00Z`)}
        </p>
        {times.length === 0 && (
          <p className="py-8 text-muted">No classes this day. Pick another.</p>
        )}
        <ul>
          {times.map((s) => {
            const full = s.spotsLeft === 0;
            const on = s.key === key;
            const minutes = Math.round(
              (Date.parse(s.endsAt) - Date.parse(s.startsAt)) / 60_000,
            );
            return (
              <li key={s.key} className="border-b border-line">
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 py-5 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-6">
                  <p>
                    <span className="block font-medium">
                      {clock(s.startsAt)}
                    </span>
                    <span className="block text-base text-muted">
                      {minutes} min
                    </span>
                  </p>
                  <p className="min-w-0">
                    <span className="block text-xl font-medium">{s.title}</span>
                    {s.instructor && (
                      <span className="block text-base text-muted">
                        With {s.instructor}
                      </span>
                    )}
                    <span className="block text-base text-muted">
                      {[
                        full
                          ? "Full"
                          : `${s.spotsLeft} ${s.spotsLeft === 1 ? "slot" : "slots"} left`,
                        s.price ? peso(s.price) : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={full}
                    aria-expanded={on}
                    aria-label={`Book ${s.title} at ${clock(s.startsAt)}`}
                    onClick={() => {
                      setKey(on ? "" : s.key);
                      setProblem("");
                    }}
                    className={`min-h-11 rounded-full border border-ink px-5 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 ${on ? "bg-page text-ink" : "bg-ink text-page"}`}
                  >
                    {full ? "Full" : on ? "Close" : "Book"}
                  </button>
                </div>
                {on && details}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
