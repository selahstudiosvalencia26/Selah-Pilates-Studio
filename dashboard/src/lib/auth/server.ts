import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAllowed, supabaseSettings } from "./config";

// Sign-in on the server. The session lives in cookies that only the server reads (httpOnly), and who is signed in is asked from
// Supabase each time, never trusted from the cookie alone.

async function client() {
  const settings = supabaseSettings();
  if (!settings) return null;
  const jar = await cookies();
  return createServerClient(settings.url, settings.key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch {
          // A page being drawn cannot write cookies. The middleware refreshes them, so nothing is lost.
        }
      },
    },
  });
}

/** The signed-in person, only if they are on the allowed list. null otherwise. */
export async function currentUser(): Promise<{ email: string } | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  return email && isAllowed(email) ? { email } : null;
}

/** true only for a right password AND an allowed email. Anyone else is left signed out, with no hint of which part was wrong. */
export async function passwordSignIn(email: string, password: string): Promise<boolean> {
  const supabase = await client();
  if (!supabase) return false;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return false;
  if (!isAllowed(data.user.email)) {
    await supabase.auth.signOut();
    return false;
  }
  return true;
}

export async function endSession(): Promise<void> {
  const supabase = await client();
  if (supabase) await supabase.auth.signOut({ scope: "local" });
}
