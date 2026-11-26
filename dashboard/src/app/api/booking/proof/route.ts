import { databaseOn } from "@/kit/database";
import { corsHeaders } from "@/systems/booking/cors";
import { attachProof } from "@/systems/booking/proof";

// Public: a customer attaches their payment screenshot to the booking they just made. See systems/booking/proof.ts for the checks.
export const dynamic = "force-dynamic";
const MAX_BODY = 610_000;

export const OPTIONS = (request: Request) => new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });

export async function POST(request: Request) {
  const headers = corsHeaders(request.headers.get("origin"));
  const reply = (message: string, status: number) => Response.json({ ok: false, message }, { status, headers });
  if (process.env.NODE_ENV === "production" && !databaseOn()) return reply("Booking is not connected yet.", 503);
  const text = await request.text();
  if (text.length > MAX_BODY) return reply("That picture is too big.", 413);
  try {
    const answer = await attachProof(JSON.parse(text));
    return Response.json(answer.body, { status: answer.status, headers });
  } catch (e) {
    console.error("payment screenshot failed", e instanceof Error ? e.message : "unknown");
    return reply("Could not send it. Please try again.", 503);
  }
}
