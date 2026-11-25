// Prototype shortcut: sign in with just an email, no code. It works ONLY while developing on your own machine AND before the
// database is connected. In production, or once the Supabase address is set, this says no, so the shortcut cannot reach a live
// site and switches itself off the moment real sign-in is set up. The server asks this on every try (see actions.ts).
export const devSkipAllowed = (): boolean => process.env.NODE_ENV !== "production" && !(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
