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
  const rows: [string, React.ReactNode][] = [
    ["When", whenLine(b, zone)],
    [b.sessionKey ? "Class" : "Event", b.eventType],
    [b.sessionKey ? "Slots" : "Guests", sizeLine(b).split(" ")[0]],
    ...(b.price === undefined ? [] : ([["Price", b.packageName ? `${peso(b.price)} (${b.packageName})` : peso(b.price)]] as [string, React.ReactNode][])),
    ...(b.sessionKey && b.deposit === "none" ? [] : ([["Deposit", depositLine(b, { ...settings, zone })]] as [string, React.ReactNode][])),
    ["Phone", <a key="p" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{b.phone}</a>],
    ...(b.email ? ([["Email", <a key="e" href={`mailto:${b.email}`} className="underline underline-offset-4">{b.email}</a>]] as [string, React.ReactNode][]) : []),
    ["Added", b.createdVia === "staff" ? "By staff" : "From the website"],
    ...(b.notes ? ([["Their notes", b.notes]] as [string, React.ReactNode][]) : []),
    ...(b.staffNote ? ([["Your note", b.staffNote]] as [string, React.ReactNode][]) : []),
  ];

  // One screen: who and what to do at the top, the details on the left, the money on the right. The rest folds away.
  const fold = "card group p-4 [&_summary::-webkit-details-marker]:hidden";
  const summary = "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Link href="/booking" className="text-sm text-text-soft underline underline-offset-4 hover:text-text">
          All bookings
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-xl font-semibold tracking-[-0.01em]">{b.customerName}</h2>
          <StatusTag booking={b} />
          <span className="flex items-center gap-2 sm:ml-auto">
            <span className="text-sm text-text-soft">
              ID <span className="font-mono text-text">{bookingRef(b.id)}</span>
            </span>
            <CopyButton text={bookingRef(b.id)} label="Copy ID" />
          </span>
        </div>
      </div>
      <BookingActions booking={b} depositDefault={pesos} today={todayInZone(zone)} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-5">
          <dl className="card grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-text-soft">{k}</dt>
                <dd className="mt-0.5 break-words text-sm">{v}</dd>
              </div>
            ))}
          </dl>
          <details className={fold}>
            <summary className={summary}>
              History ({b.history.length})
              <Icon name="chevron-down" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <ol className="mt-2 grid gap-2 text-sm">
              {[...b.history].reverse().map((h, i) => (
                <li key={i} className="grid gap-0.5 sm:grid-cols-[10rem_1fr]">
                  <span className="text-text-soft">{whenWords(h.at, zone)}</span>
                  <span>{h.what}</span>
                </li>
              ))}
            </ol>
          </details>
        </div>

        <div className="grid gap-5">
          {proof && (
            <section aria-labelledby="proof" className="grid gap-3 rounded-xl border border-accent bg-card p-4">
              <div>
                <h3 id="proof" className="text-base font-medium">
                  Payment screenshot
                </h3>
                <p className="text-sm text-text-soft">Sent {whenWords(proof.at, zone)}. Check the money arrived before marking it paid.</p>
              </div>
              <ProofImage src={proof.image} who={b.customerName} />
            </section>
          )}
          {asking &&
            // Once their screenshot is here, sending the payment details again is rarely needed, so it folds away.
            (proof ? (
              <details className={fold}>
                <summary className={summary}>
                  Send the payment details
                  <Icon name="chevron-down" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <div className="mt-3">
                  <PaymentRequest message={paymentMessage(b, settings)} accounts={settings.payAccounts} />
                </div>
              </details>
            ) : (
              <PaymentRequest message={paymentMessage(b, settings)} accounts={settings.payAccounts} />
            ))}
        </div>
      </div>
    </div>
  );
}
