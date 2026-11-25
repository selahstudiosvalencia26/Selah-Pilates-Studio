import { databaseOn } from "@/kit/database";
import { corsHeaders } from "@/systems/booking/cors";
import { availability } from "@/systems/booking/public";

// Public: which dates and times are open, or which classes have spots. Busy times only, never a name. Not on a live site until
// the database is connected.
export const dynamic = "force-dynamic";

export const OPTIONS = (request: Request) => new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });

export async function GET(request: Request) {
  const headers = corsHeaders(request.headers.get("origin"));
  if (process.env.NODE_ENV === "production" && !databaseOn()) return Response.json({ ok: false, message: "Booking is not connected yet." }, { status: 503, headers });
  try {
    const answer = await availability(new URL(request.url).searchParams);
    return Response.json(answer.body, { status: answer.status, headers });
  } catch (e) {
    console.error("booking availability failed", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false, message: "Booking is not available right now." }, { status: 503, headers });
  }
}
