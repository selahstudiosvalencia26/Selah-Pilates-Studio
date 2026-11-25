// The keyboard rules of the Select (Select.tsx), as plain functions with no screen, so they are tested on their own.
// An option is one choice in the list. A disabled one is shown but can never be picked or landed on.
export type Option = { value: string; label: string; hint?: string; disabled?: boolean; swatch?: string }; // swatch: a small coloured square before the words, a CSS colour such as "var(--accent)"

const enabled = (o: Option) => !o.disabled;

// The first choice that can be picked, or -1 when there is none.
export const firstEnabled = (options: readonly Option[]): number => options.findIndex(enabled);

// Where the highlight goes after an arrow, Home or End. It stops at the ends (no wrapping, so a long list never loops) and skips disabled
// choices. `from` is the highlighted choice now, or -1 for none.
export function moveActive(options: readonly Option[], from: number, key: "ArrowDown" | "ArrowUp" | "Home" | "End"): number {
  const ok = options.map((o, i) => (enabled(o) ? i : -1)).filter((i) => i >= 0);
  if (ok.length === 0) return -1;
  if (key === "Home") return ok[0];
  if (key === "End") return ok[ok.length - 1];
  if (key === "ArrowDown") return ok.find((i) => i > from) ?? ok[ok.length - 1];
  return [...ok].reverse().find((i) => i < from) ?? ok[0];
}

// Typing letters jumps to the next choice that starts with them ("ma" finds "Mat Basics"). Typing the same letter again moves on to
// the next one that starts with it. `typed` is everything typed in the last moment. Returns the choice to highlight, or -1 for none.
export function typeahead(options: readonly Option[], from: number, typed: string): number {
  const text = typed.toLowerCase();
  if (!text) return -1;
  const starts = (o: Option) => enabled(o) && o.label.toLowerCase().startsWith(text);
  const sameLetter = text.length > 1 && [...text].every((c) => c === text[0]);
  const needle = sameLetter ? text[0] : text;
  const hit = (o: Option) => enabled(o) && o.label.toLowerCase().startsWith(needle);
  const after = options.findIndex((o, i) => i > from && (sameLetter ? hit(o) : starts(o)));
  if (after !== -1) return after;
  return options.findIndex((o) => (sameLetter ? hit(o) : starts(o)));
}
