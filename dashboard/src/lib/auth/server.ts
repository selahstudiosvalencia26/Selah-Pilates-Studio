import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { accessFor, type Access } from "./access";
import { supabaseSettings } from "./config";

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

/** The signed-in person with what they may do. null when nobody is signed in, or they are not (or no longer) on the team. */
export async function currentUser(): Promise<Access | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return accessFor(data.user?.email);
}

/** true only for a right password AND someone who may get in. Anyone else is left signed out, with no hint of which part was wrong. */
export async function passwordSignIn(email: string, password: string): Promise<boolean> {
  const supabase = await client();
  if (!supabase) return false;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return false;
  if (!(await accessFor(data.user.email))) {
    await supabase.auth.signOut();
    return false;
  }
  return true;
}

/** Is this the person's password? Asked with a throwaway session, so their own is not touched. */
export async function passwordIsRight(email: string, password: string): Promise<boolean> {
  const settings = supabaseSettings();
  if (!settings) return false;
  const probe = createClient(settings.url, settings.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await probe.auth.signInWithPassword({ email, password });
  return !error;
}

/** The id of the signed-in sign-in, for changing its password. */
export async function currentId(): Promise<string | null> {
  const supabase = await client();
  if (!supabase) return null;
  return (await supabase.auth.getUser()).data.user?.id ?? null;
}

export async function endSession(): Promise<void> {
  const supabase = await client();
  if (supabase) await supabase.auth.signOut({ scope: "local" });
}
