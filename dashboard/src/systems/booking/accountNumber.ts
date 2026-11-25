import type { PayKind } from "./schema";

// An account or mobile number as people read it, formatted while it is typed. Letters and extra digits are dropped.
//   mobile (GCash, Maya, an e-wallet number starting 09 or +63):  0917 123 4567  or  +63 917 123 4567
//   bank accounts and other numbers:                              1234 5678 9012
const group = (digits: string, sizes: number[]) => {
  const out: string[] = [];
  let at = 0;
  for (const size of sizes) {
    if (at >= digits.length) break;
    out.push(digits.slice(at, at + size));
    at += size;
  }
  return out.join(" ");
};

export function formatAccountNumber(kind: PayKind, typed: string): string {
  const digits = typed.replace(/\D/g, "");
  const abroad = typed.trim().startsWith("+");
  const mobile = kind === "gcash" || kind === "maya" || (kind === "ewallet" && (abroad || digits.startsWith("09")));
  if (!mobile) return group(digits.slice(0, 20), [4, 4, 4, 4, 4]);
  if (abroad) return `+${group(digits.slice(0, 12), [2, 3, 3, 4])}`;
  return group(digits.slice(0, 11), [4, 3, 4]);
}

// Where the cursor goes after formatting: after the same number of digits as before it.
export function caretAfter(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return formatted.startsWith("+") ? 1 : 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) if (/\d/.test(formatted[i]) && ++seen === digitsBefore) return i + 1;
  return formatted.length;
}
