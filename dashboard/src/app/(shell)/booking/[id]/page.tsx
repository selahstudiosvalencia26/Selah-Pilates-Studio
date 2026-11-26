import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/kit/CopyButton";
import Icon from "@/kit/Icon";
import ProofImage from "@/systems/booking/ProofImage";
import { myPermissions } from "@/kit/session";
import { bookingRef } from "@/systems/booking/ref";
import { todayInZone } from "@/kit/time";
import { readProof } from "@/systems/booking/proof";
import BookingActions from "@/systems/booking/BookingActions";
import { depositLine, paymentMessage, sizeLine, whenLine } from "@/systems/booking/format";
import PaymentRequest from "@/systems/booking/PaymentRequest";
import { depositFor, peso } from "@/systems/booking/pricing";
import StatusTag from "@/systems/booking/StatusTag";
import { readData } from "@/systems/booking/store";
import { whenWords } from "@/systems/booking/time";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bookings, settings } = await readData();
  const b = bookings.find((x) => x.id === id && x.deletedAt === null);
  if (!b || !(await myPermissions()).some((x) => x === "*" || x === "booking.view")) notFound();
  const proof = await readProof(b.id);
  const zone = settings.zone;
  const pesos = ((b.depositAmount || depositFor(settings, b.price) || settings.depositAmount) / 100).toFixed(2).replace(/\.00$/, "");

  const asking = b.status === "requested" && b.deposit === "waiting";
  // The money in three figures: the price, what was asked up front (paid or not yet), and what is left for the studio.
  const upFront = b.deposit === "paid" || b.deposit === "waiting" ? b.depositAmount : 0;
  const money = [
    ...(b.price === undefined ? [] : [{ label: b.packageName ? `Price (${b.packageName})` : "Price", value: peso(b.price) }]),
    ...(upFront > 0 ? [{ label: b.deposit === "paid" ? "Paid" : "To pay now", value: peso(upFront) }] : []),
    ...(b.price !== undefined && upFront > 0 && b.price > upFront ? [{ label: "Left to pay", value: peso(b.price - upFront) }] : []),
  ];
  const contact = [
    { label: "Phone", value: b.phone, href: `tel:${b.phone.replace(/[^\d+]/g, "")}` },
    ...(b.email ? [{ label: "Email", value: b.email, href: `mailto:${b.email}` }] : []),
  ];

  const fold = "group [&_summary::-webkit-details-marker]:hidden";
  const summary = "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent";
  const chevron = <Icon name="chevron-down" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />;

  // One screen: a header card with who, what, when and the buttons; under it the money and the person side by side.
  return (
    <div className="grid gap-4">
      <Link href="/booking" className="justify-self-start text-sm text-text-soft underline underline-offset-4 hover:text-text">
        All bookings
      </Link>

      <section aria-label="Booking" className="card grid gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.015em]">{b.customerName}</h2>
              <span className="rounded-full bg-surface px-3 py-1">
                <StatusTag booking={b} />
              </span>
            </div>
            <p className="mt-1 text-sm text-text-soft">
              <span className="font-medium text-text">{b.eventType}</span> · {whenLine(b, zone)} · {sizeLine(b)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-soft">
              ID <span className="font-mono text-text">{bookingRef(b.id)}</span>
            </span>
            <CopyButton text={bookingRef(b.id)} label="Copy" />
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <BookingActions booking={b} depositDefault={pesos} today={todayInZone(zone)} />
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="pay-h" className={`card grid gap-4 p-5 ${proof && asking ? "!border-accent" : ""}`}>
          <h3 id="pay-h" className="text-base font-semibold">
            Payment
          </h3>
          {money.length > 0 && (
            <dl className="grid grid-cols-3 gap-3">
              {money.map((m) => (
                <div key={m.label} className="rounded-xl bg-surface p-3">
                  <dt className="text-xs text-text-soft">{m.label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {!(b.sessionKey && b.deposit === "none") && <p className="text-sm text-text-soft">{depositLine(b, { ...settings, zone })}</p>}
          {proof && (
            <div className="flex flex-wrap items-start gap-4 border-t border-border pt-4">
              <ProofImage src={proof.image} who={b.customerName} />
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm font-medium">Payment screenshot</p>
                <p className="mt-1 text-sm text-text-soft">Sent {whenWords(proof.at, zone)}. Check the money arrived in your account before marking it paid.</p>
              </div>
            </div>
          )}
          {asking && (
            <div className="border-t border-border pt-2">
              {/* Folded, so the page fits one screen: open it when the details need sending. */}
              <details className={fold}>
                <summary className={summary}>
                  Send the payment details
                  {chevron}
                </summary>
                <div className="mt-2">
                  <PaymentRequest message={paymentMessage(b, settings)} accounts={settings.payAccounts} />
                </div>
              </details>
            </div>
          )}
        </section>

        <div className="grid gap-4">
          <section aria-labelledby="who-h" className="card grid gap-4 p-5">
            <h3 id="who-h" className="text-base font-semibold">
              Customer
            </h3>
            {contact.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-text-soft">{c.label}</p>
                  <a href={c.href} className="block break-all text-sm underline underline-offset-4">
                    {c.value}
                  </a>
                </div>
                <CopyButton text={c.value} label="Copy" />
              </div>
            ))}
            {b.notes && (
              <div>
                <p className="text-xs text-text-soft">Their note</p>
                <p className="break-words text-sm">{b.notes}</p>
              </div>
            )}
            {b.staffNote && (
              <div>
                <p className="text-xs text-text-soft">Your note</p>
                <p className="break-words text-sm">{b.staffNote}</p>
              </div>
            )}
            <p className="text-xs text-text-soft">{b.createdVia === "staff" ? "Added by staff" : "Booked from the website"}</p>
          </section>
          <details className={`card px-5 py-2 ${fold}`}>
            <summary className={summary}>
              History ({b.history.length})
              {chevron}
            </summary>
            <ol className="grid gap-3 pb-3 pt-1 text-sm">
              {[...b.history].reverse().map((h, i) => (
                <li key={i}>
                  <p>{h.what}</p>
                  <p className="text-xs text-text-soft">{whenWords(h.at, zone)}</p>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>
    </div>
  );
}
