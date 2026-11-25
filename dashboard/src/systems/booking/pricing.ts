import { formatMinor } from "@/kit/money";
import type { Settings } from "./schema";

// What a venue booking costs and what deposit is asked, as plain functions. All money is whole centavos.
// A price is worked out once, when the booking is made, and kept on it: changing the prices later never changes old bookings.

type Priced = Pick<Settings, "priceType" | "hourPrice" | "packages">;
type DepositRule = Pick<Settings, "depositRequired" | "depositKind" | "depositAmount" | "depositPercent">;

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

// The package a request means: the one picked, or (staff adding by hand) the one that lasts exactly that long.
export function packageFor(s: Priced, start: string, end: string, packageId?: string) {
  const long = minutes(end) - minutes(start);
  const fits = s.packages.filter((p) => p.hours * 60 === long);
  return (packageId ? fits.find((p) => p.id === packageId) : fits[0]) ?? null;
}

// The price of this time, or undefined when no price applies.
export function priceFor(s: Priced, start: string, end: string, packageId?: string): number | undefined {
  if (s.priceType === "hour") return s.hourPrice > 0 ? Math.round((s.hourPrice * (minutes(end) - minutes(start))) / 60) : undefined;
  if (s.priceType === "package") return packageFor(s, start, end, packageId)?.price;
  return undefined;
}

// A booking over several days costs the day price for each day, or has no price when none is set.
export const priceForDays = (s: Pick<Settings, "priceType" | "dayPrice">, days: number): number | undefined => (s.priceType !== "none" && s.dayPrice > 0 ? s.dayPrice * days : undefined);

// The deposit to ask for. A share needs a price; a booking with none falls back to the fixed amount.
export function depositFor(s: DepositRule, price?: number): number {
  if (!s.depositRequired) return 0;
  if (s.depositKind === "percent" && price !== undefined) return Math.round((price * s.depositPercent) / 100);
  return s.depositAmount;
}

// A class asks for a deposit only when there is a way to pay it, so a customer is never asked for money with nowhere to send it.
export const classDeposit = (s: DepositRule & { payAccounts: readonly unknown[] }, price?: number): number => (s.payAccounts.length > 0 ? depositFor(s, price) : 0);

export const peso = (centavos: number) => formatMinor(centavos, "PHP");
