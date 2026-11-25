import { formatMinor } from "@/kit/money";
import { depositFor } from "./pricing";
import { isOverdue } from "./rules";
import { payLabel, type Booking, type PayAccount } from "./schema";
import { localParts, whenWords } from "./time";

// One line about when, and one about who and how many, shared by the list, the calendar and the detail page.
export const whenLine = (b: Pick<Booking, "startsAt" | "endsAt">, zone: string) => {
  const end = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(b.endsAt));
  const several = localParts(b.startsAt, zone).date !== localParts(b.endsAt, zone).date;
  return `${whenWords(b.startsAt, zone)} to ${several ? whenWords(b.endsAt, zone) : end}`;
};

export const sizeLine = (b: Pick<Booking, "guests" | "sessionKey">) => (b.sessionKey ? `${b.guests} ${b.guests === 1 ? "slot" : "slots"}` : `${b.guests} guests`);

// The message staff send with the payment details, in the customer's words.
export const paymentMessage = (
  b: Pick<Booking, "customerName" | "startsAt" | "endsAt" | "depositAmount" | "payBy"> & Partial<Pick<Booking, "sessionKey">>,
  s: { zone: string; venue: string; payAccounts: PayAccount[] },
) => {
  const ways = s.payAccounts.map((a) => `${payLabel(a)}: ${a.number || "scan the QR picture"} (${a.name})`);
  return [
    `Hi ${b.customerName}, here is how to hold your ${b.sessionKey ? "slot" : "date"}: ${whenLine(b, s.zone)}.`,
    `Please send ${formatMinor(b.depositAmount, "PHP")}${b.payBy ? ` before ${whenWords(b.payBy, s.zone)}` : ""} to ${ways.length === 1 ? "this account" : "one of these"}:`,
    ...ways,
    b.sessionKey ? "Then reply with a screenshot of your payment. Your slot is confirmed once we receive it." : "Then reply with a screenshot of your payment. The date goes to whoever pays first.",
    s.venue,
  ].join("\n");
};

// `ask` is the deposit that will be asked for on confirming (0 when deposits are off).
export const depositLine = (b: Pick<Booking, "status" | "deposit" | "depositAmount" | "payBy" | "price">, { zone, ...rule }: { zone: string; depositRequired: boolean; depositKind: "fixed" | "percent"; depositAmount: number; depositPercent: number }) => {
  const money = formatMinor(b.depositAmount, "PHP");
  if (b.deposit === "waiting") {
    if (isOverdue(b)) return `${money} is overdue (was due ${whenWords(b.payBy!, zone)})`;
    return b.payBy ? `Waiting for ${money}, due ${whenWords(b.payBy, zone)}` : `Waiting for ${money}`;
  }
  if (b.deposit === "paid") return `${money} paid`;
  if (b.deposit === "void") return `${money} voided`;
  const ask = depositFor(rule, b.price);
  if (b.status === "requested" && ask > 0) return `Asked when you confirm (${formatMinor(ask, "PHP")})`;
  return "No deposit";
};
