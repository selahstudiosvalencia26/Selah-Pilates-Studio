import { createHash } from "node:crypto";

// Has this password appeared in a known data breach? Asked of Have I Been Pwned's "range" service in a way that never
// sends the password, or even its full fingerprint (k-anonymity): only the first 5 characters of the password's SHA-1
// fingerprint leave the server, and the match is made here. The address is fixed in this file, never typed by a person, so
// this cannot be turned into a request to somewhere else (no SSRF). Server only.
//
// Answers: true = found in a breach, false = not found, null = could not ask (the service is slow or down). The caller
// decides what null means. A short time limit stops a slow service from holding the person up (docs/rules/rules.md).
const RANGE = "https://api.pwnedpasswords.com/range/";

export async function isBreached(
  password: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean | null> {
  // For tests and for a computer with no internet: set PASSWORD_BREACH_CHECK=off to skip the question.
  if (process.env.PASSWORD_BREACH_CHECK === "off") return null;

  const fingerprint = createHash("sha1")
    .update(password, "utf8")
    .digest("hex")
    .toUpperCase();
  const prefix = fingerprint.slice(0, 5);
  const rest = fingerprint.slice(5);
  try {
    const response = await fetcher(`${RANGE}${prefix}`, {
      headers: { "Add-Padding": "true" }, // the service adds fake lines, so the size of the answer says nothing
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const lines = (await response.text()).split("\n");
    return lines.some((line) => {
      const [suffix, count] = line.trim().split(":");
      return suffix === rest && Number(count) > 0;
    });
  } catch {
    return null;
  }
}
