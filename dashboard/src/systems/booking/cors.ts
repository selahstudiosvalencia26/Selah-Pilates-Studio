// Which websites may call the public doors from a browser. BOOKING_ALLOWED_ORIGINS is a comma list ("https://dancafe.example,http://localhost:3000").
// Nothing is allowed until the list is set, so a stranger's page cannot send bookings through a visitor's browser.
export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = (process.env.BOOKING_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const headers: Record<string, string> = { Vary: "Origin", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}
