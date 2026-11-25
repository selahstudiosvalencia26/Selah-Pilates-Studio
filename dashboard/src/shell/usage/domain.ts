// The website's domain and the day it must be renewed. Plain rules, no saving and no screen.
// A lapsed domain takes the whole website down, so it is warned about a month ahead.
export const WARN_DAYS = 30;

export type DomainState = { days: number; level: "fine" | "soon" | "lapsed"; words: string };

export function domainState(renewsOn: string, today: string): DomainState | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(renewsOn)) return null;
  const days = Math.round((Date.parse(`${renewsOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (Number.isNaN(days)) return null;
  const count = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
  if (days < 0) return { days, level: "lapsed", words: `The renewal date passed ${count(-days)} ago. Renew it now, or the website can stop working.` };
  if (days === 0) return { days, level: "soon", words: "The domain must be renewed today." };
  return days <= WARN_DAYS
    ? { days, level: "soon", words: `The domain renews in ${count(days)}. Turn on auto renew, or pay before then.` }
    : { days, level: "fine", words: `The domain renews in ${count(days)}.` };
}
