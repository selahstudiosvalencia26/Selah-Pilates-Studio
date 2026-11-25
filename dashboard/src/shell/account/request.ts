import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

// Who is asking, as far as the server can tell. Used only to count tries, never stored or shown. Server only.
export async function requestAddress(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0] ??
    h.get("x-real-ip") ??
    "unknown"
  )
    .trim()
    .slice(0, 64);
}

// A short id for one request, written next to its log line so a problem can be followed without any personal detail.
export const requestId = (): string => randomUUID().slice(0, 8);
