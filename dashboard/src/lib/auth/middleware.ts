import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowed, supabaseSettings } from "./config";
import { bookingOnline, openOnLive } from "./livePages";

// Runs before every page: keeps the session fresh and sends anyone who is not signed in to the sign-in screen. Pages check again
// on the server, so this is the first lock, not the only one.

// Open to anyone: the sign-in screen, its tab icon, and the doors the website uses for booking (which have their own checks).
const OPEN = ["/sign-in", "/brand-icon", "/api/booking"];

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
  if (isAllowed(data.user?.email)) {
    if (process.env.NODE_ENV !== "production" || path.startsWith("/api/") || openOnLive(path, bookingOnline())) return response;
    return NextResponse.redirect(new URL("/preview", request.url));
  }

  if (path.startsWith("/api/")) return NextResponse.json({ ok: false, message: "Please sign in." }, { status: 401 });
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
