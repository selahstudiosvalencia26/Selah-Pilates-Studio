import { createClient } from "@supabase/supabase-js";

// Making and resetting sign-ins for team members, with the secret key. Server only; every caller checks for the owner first.
function admin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) throw new Error("The database is not set up.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
}

/** Make the sign-in for this email, or give an existing one this password. Returns its id. */
export async function setLogin(email: string, password: string): Promise<string> {
  const made = await admin().createUser({ email, password, email_confirm: true });
  if (made.data.user) return made.data.user.id;
  // Already there (added before, then removed): find it and set the new password.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin().listUsers({ page, perPage: 200 });
    if (error) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      const done = await admin().updateUserById(found.id, { password, email_confirm: true });
      if (done.error) break;
      return found.id;
    }
    if (data.users.length < 200) break;
  }
  throw new Error("The sign-in could not be made.");
}

/** A password for the person whose id this is. */
export async function setPasswordFor(id: string, password: string): Promise<void> {
  const { error } = await admin().updateUserById(id, { password });
  if (error) throw new Error("The password could not be changed.");
}
