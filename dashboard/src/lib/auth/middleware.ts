import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { accessFor } from "./access";
import { supabaseSettings } from "./config";
import { databaseReady, mayOpen, openOnLive } from "./livePages";

// Runs before every page: keeps the session fresh and sends anyone who is not signed in to the sign-in screen. Pages check again
// on the server, so this is the first lock, not the only one.

// Open to anyone: the sign-in screen, its tab icon, and the doors the website uses (booking, and its own public words).
const OPEN = ["/sign-in", "/brand-icon", "/api/booking", "/api/site-content"];

export async function guardRequest(request: NextRequest): Promise<NextResponse> {
  const settings = supabaseSettings();
  if (!settings) return NextResponse.next(); // not set up: pages stay closed on a live site by their own check

  let response = NextResponse.next({ request });
  const supabase = createServerClient(settings.url, settings.key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const open = OPEN.some((p) => path === p || path.startsWith(`${p}/`));
  if (open) return response;
  const who = await accessFor(data.user?.email);
  if (who) {
    if (process.env.NODE_ENV !== "production") return response;
    // On a temporary password the only place to go is the page that replaces it.
    if (who.mustChange && path !== "/welcome") return NextResponse.redirect(new URL("/welcome", request.url));
    if (path.startsWith("/api/")) return response; // each of these checks for itself
    if (openOnLive(path, databaseReady()) && mayOpen(path, who)) return response;
    return NextResponse.redirect(new URL("/preview", request.url));
  }

  if (path.startsWith("/api/")) return NextResponse.json({ ok: false, message: "Please sign in." }, { status: 401 });
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
