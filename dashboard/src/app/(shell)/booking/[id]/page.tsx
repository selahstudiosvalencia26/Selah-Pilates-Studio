import Link from "next/link";
import { notFound } from "next/navigation";
import { myPermissions } from "@/kit/session";
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

  const rows: [string, React.ReactNode][] = [
    ["When", whenLine(b, zone)],
    [b.sessionKey ? "Slots" : "Guests", sizeLine(b).split(" ")[0]],
    [b.sessionKey ? "Class" : "Event", b.eventType],
    ...(b.price === undefined ? [] : ([["Price", b.packageName ? `${peso(b.price)} (${b.packageName})` : peso(b.price)]] as [string, React.ReactNode][])),
    ["Phone", <a key="p" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{b.phone}</a>],
    ...(b.email ? ([["Email", <a key="e" href={`mailto:${b.email}`} className="underline underline-offset-4">{b.email}</a>]] as [string, React.ReactNode][]) : []),
    ...(b.sessionKey && b.deposit === "none" ? [] : ([["Deposit", depositLine(b, { ...settings, zone })]] as [string, React.ReactNode][])),
    ...(b.notes ? ([["Their notes", b.notes]] as [string, React.ReactNode][]) : []),
    ...(b.staffNote ? ([["Your note", b.staffNote]] as [string, React.ReactNode][]) : []),
    ["Added", b.createdVia === "staff" ? "By staff" : "From the website"],
  ];

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Link href="/booking" className="text-sm text-text-soft underline underline-offset-4 hover:text-text">
          All bookings
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h2 className="text-xl font-semibold tracking-[-0.01em]">{b.customerName}</h2>
          <StatusTag booking={b} />
        </div>
      </div>
      {proof && (
        <section aria-labelledby="proof" className="grid gap-3 rounded-xl border border-accent bg-card p-4">
          <div>
            <h3 id="proof" className="text-base font-medium">
              Payment screenshot
            </h3>
            <p className="text-sm text-text-soft">Sent {whenWords(proof.at, zone)}. Check the money really arrived before marking it paid.</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- a private picture, sent with the page */}
          <img src={proof.image} alt={`Payment screenshot from ${b.customerName}`} className="max-h-[32rem] w-auto max-w-full justify-self-start rounded-lg border border-border" />
        </section>
      )}
      <BookingActions booking={b} depositDefault={pesos} today={todayInZone(zone)} />
      {b.status === "requested" && b.deposit === "waiting" && <PaymentRequest message={paymentMessage(b, settings)} accounts={settings.payAccounts} />}
      <dl className="grid divide-y divide-border rounded-xl border border-border bg-card">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-text-soft">{k}</dt>
            <dd className="min-w-0 break-words text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="hist" className="grid gap-3">
        <h3 id="hist" className="text-base font-medium">
          History
        </h3>
        <ol className="grid gap-2 text-sm">
          {[...b.history].reverse().map((h, i) => (
            <li key={i} className="grid gap-0.5 sm:grid-cols-[10rem_1fr]">
              <span className="text-text-soft">{whenWords(h.at, zone)}</span>
              <span>{h.what}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
