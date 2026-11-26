// Counting and wording for "What can run out". No server code, so the screen can use it too.
// The limits are those of the free plans (Gmail's sending limit; resend.com account quotas; supabase.com pricing). Days are UTC.
export const EMAIL_LIMITS = { gmail: { day: 500, month: 15000 }, resend: { day: 100, month: 3000 } };
export const SPACE_LIMITS = { database: 500 * 1024 * 1024, files: 1024 * 1024 * 1024 };

export type EmailCount = { ok: true; today: number; month: number; via: "gmail" | "resend" } | { ok: false; why: "off" };
export type Space = { ok: true; database: number; files: number } | { ok: false; why: "off" | "missing" };

export function countDays(days: Record<string, number>, now: Date): { today: number; month: number } {
  const day = now.toISOString().slice(0, 10);
  const month = Object.entries(days).reduce((n, [d, c]) => (d.slice(0, 7) === day.slice(0, 7) ? n + c : n), 0);
  return { today: days[day] ?? 0, month };
}

export const megabytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${mb > 0 && mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
};
