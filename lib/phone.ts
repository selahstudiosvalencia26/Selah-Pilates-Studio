// Spaces a Philippine mobile number as it is typed: "09762155070" becomes "0976 215 5070", and "+639762155070" becomes
// "+63 976 215 5070". Anything that is not a digit (or a leading +) is dropped. Other numbers are spaced the same way, 4-3-4.
export function formatPhone(value: string): string {
  const plus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "").slice(0, plus ? 12 : 11);
  const group = (d: string, sizes: number[]) => {
    const out: string[] = [];
    let at = 0;
    for (const size of sizes) {
      if (at >= d.length) break;
      out.push(d.slice(at, at + size));
      at += size;
    }
    return out.join(" ");
  };
  if (plus)
    return digits.startsWith("63")
      ? `+${group(digits, [2, 3, 3, 4])}`
      : `+${digits}`;
  return group(digits, [4, 3, 4]);
}

/** Formats what is in a phone box and keeps the cursor after the same digit, so fixing a middle digit does not jump to the end. */
export function formatPhoneBox(box: HTMLInputElement): string {
  const before = box.value
    .slice(0, box.selectionStart ?? box.value.length)
    .replace(/[^\d+]/g, "").length;
  const next = formatPhone(box.value);
  let at = 0;
  for (let seen = 0; at < next.length && seen < before; at++)
    if (/[\d+]/.test(next[at])) seen++;
  requestAnimationFrame(() => {
    if (document.activeElement === box) box.setSelectionRange(at, at);
  });
  return next;
}
