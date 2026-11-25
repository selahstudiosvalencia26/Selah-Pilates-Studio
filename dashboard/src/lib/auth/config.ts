// Whether real sign-in is set up, and who may get in. Read from the environment each time, never written down in code.
//
// Sign-in is on when the Supabase address and public key are set. Only the emails in DASHBOARD_OWNER_EMAILS (a comma list, server
// only) may use the dashboard. With no list, nobody may: Supabase can let strangers create accounts, so having an account is never
// enough by itself.

export const supabaseSettings = (): { url: string; key: string } | null => {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return url && key ? { url, key } : null;
};

export const authOn = (): boolean => supabaseSettings() !== null;

export const allowedEmails = (): string[] =>
  (process.env.DASHBOARD_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAllowed = (email: string | null | undefined): boolean =>
  Boolean(email) && allowedEmails().includes(email!.trim().toLowerCase());
