// Counting and wording for "What can run out". No server code, so the screen can use it too.
// The limits are those of the free plans (resend.com account quotas; supabase.com pricing). Resend counts days in UTC.
export const EMAIL_LIMITS = { day: 100, month: 3000 };
export const SPACE_LIMITS = { database: 500 * 1024 * 1024, files: 1024 * 1024 * 1024 };

export type EmailCount = { ok: true; today: number; month: number; atLeast: boolean } | { ok: false; why: "off" | "key" | "unreachable" };
export type Space = { ok: true; database: number; files: number } | { ok: false; why: "off" | "missing" };

export function countEmails(sent: string[], now: Date): { today: number; month: number } {
  const day = now.toISOString().slice(0, 10);
  const days = sent.map((s) => new Date(s.replace(" ", "T")).toISOString().slice(0, 10));
  return { today: days.filter((d) => d === day).length, month: days.filter((d) => d.slice(0, 7) === day.slice(0, 7)).length };
}

export const megabytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${mb > 0 && mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
};
