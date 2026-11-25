import { databaseOn } from "@/kit/database";
import { corsHeaders } from "@/systems/booking/cors";
import { request as send } from "@/systems/booking/public";

// Public: a customer sends a booking. Small body only, checked strictly, limited by caller and by phone. It never confirms a venue
// request: staff do. Not on a live site until the database is connected.
export const dynamic = "force-dynamic";
const MAX_BODY = 5_000;

export const OPTIONS = (request: Request) => new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });

export async function POST(request: Request) {
  const headers = corsHeaders(request.headers.get("origin"));
  const reply = (message: string, status: number) => Response.json({ ok: false, message }, { status, headers });
  if (process.env.NODE_ENV === "production" && !databaseOn()) return reply("Booking is not connected yet.", 503);
  const text = await request.text();
  if (text.length > MAX_BODY) return reply("That is too much to send.", 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return reply("Check the details and try again.", 400);
  }
  const caller = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    const answer = await send(body, caller);
    return Response.json(answer.body, { status: answer.status, headers });
  } catch (e) {
    console.error("booking request failed", e instanceof Error ? e.message : "unknown");
    return reply("Booking is not available right now.", 503);
  }
}
