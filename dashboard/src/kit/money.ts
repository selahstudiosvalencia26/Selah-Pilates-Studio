// Money, exactly. Amounts are whole numbers of the smallest unit (centavos), never decimals, so nothing is ever
// off by a fraction (docs/rules/rules.md). The currency is always stored beside the amount.

// "1,234.50" -> 123450. Null if it is not a clean amount with at most two decimals.
export function parseAmount(input: string): number | null {
  const text = input.trim().replace(/,/g, "");
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const whole = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * 100 + cents;
  return Number.isSafeInteger(minor) ? minor : null;
}

const SYMBOL: Record<string, string> = { PHP: "₱", USD: "$" };

// 123450, "PHP" -> "₱1,234.50". Whole amounts drop the zeros: "₱1,234".
export function formatMinor(minor: number, currency: string): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  const text = whole.toLocaleString("en-US") + (cents ? `.${String(cents).padStart(2, "0")}` : "");
  return `${sign}${SYMBOL[currency] ?? `${currency} `}${text}`;
}

export const sumMinor = (amounts: readonly number[]): number => amounts.reduce((total, n) => total + n, 0);
