// The rules for a new password, in one place. Pure text checks with no secrets and no server code, so the screen can use the same
// rules to show what is still missing while a person types, and the server uses them again before anything is saved
// (the browser is never trusted: docs/rules/security.md, section 4).
//
// The choices follow current guidance (NIST SP 800-63B) rather than old habits:
//  - Length matters more than tricks. At least 12 characters, and no forced mix of capitals, digits and symbols.
//  - Spaces and any characters are allowed, and pasting from a password manager is never blocked.
//  - The most common passwords, a password that contains the person's own email, and plain runs like 123456789012 are refused.
//  - A password that has appeared in a known data breach is refused by a separate, server-only check (./breach.ts).
//  - At most 72 bytes. Supabase Auth hashes with bcrypt, which silently ignores everything after 72 bytes, so a longer
//    password would look stronger than it is. Saying no is safer than quietly cutting it.

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX_BYTES = 72;
/** The most that is read from a form at all, so a huge paste cannot make the server work hard. */
export const PASSWORD_INPUT_MAX = 256;

export type PasswordProblem =
  "short" | "long" | "common" | "email" | "plain" | "same";

// What to tell the person, in plain words. One sentence each.
export const PASSWORD_WORDS: Record<PasswordProblem, string> = {
  short: `Use at least ${PASSWORD_MIN} characters.`,
  long: "That password is too long. Use 72 characters or fewer.",
  common: "That password is too common. Choose one that is harder to guess.",
  email: "Do not use part of your email in your password.",
  plain:
    "That password is too simple. Avoid repeats and runs like 123456 or abcdef.",
  same: "Choose a password you have not used here before.",
};

// A short list of the passwords that are tried first by anyone guessing. It is not the only defence: the breach check
// (./breach.ts) covers the millions that are not listed here.
const COMMON = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "password1234",
  "passw0rd",
  "p@ssw0rd",
  "p@ssword",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "qwertyuiop12",
  "qwertyuiop123",
  "asdfghjkl",
  "asdfghjkl123",
  "zxcvbnm",
  "1q2w3e4r",
  "1q2w3e4r5t",
  "1qaz2wsx",
  "iloveyou",
  "iloveyou123",
  "letmein",
  "letmein123",
  "welcome",
  "welcome1",
  "welcome123",
  "admin",
  "admin123",
  "administrator",
  "changeme",
  "changeme123",
  "dragon",
  "monkey",
  "football",
  "baseball",
  "master",
  "sunshine",
  "princess",
  "superman",
  "batman",
  "trustno1",
  "abc123",
  "abcd1234",
  "abc12345",
  "111111",
  "123123",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "0987654321",
  "000000",
  "secret",
  "secret123",
  "login",
  "dashboard",
  "mypassword",
  "mypassword1",
  "pa55word",
  "passwort",
  "contrasena",
  "motdepasse",
  "pilates",
  "business",
  "company",
  "owner",
  "manager",
]);

const lettersOnly = (text: string) => text.replace(/[^a-z]/g, "");
const lettersAndDigits = (text: string) => text.replace(/[^a-z0-9]/g, "");

// 12 or more of the same character, or a straight run up or down such as 123456789012 or abcdefghijkl. Digits wrap round
// (…8, 9, 0, 1…), because 1234567890123 is as easy to guess as 1234567.
function isPlain(text: string): boolean {
  const chars = Array.from(text.toLowerCase());
  if (chars.length < 4) return false;
  if (new Set(chars).size <= 2) return true; // aaaaaaaaaaaa, ababababab
  let up = true;
  let down = true;
  for (let i = 1; i < chars.length; i++) {
    const a = chars[i - 1];
    const b = chars[i];
    const step =
      /\d/.test(a) && /\d/.test(b)
        ? (Number(b) - Number(a) + 10) % 10
        : b.codePointAt(0)! - a.codePointAt(0)!;
    if (step !== 1) up = false;
    if (step !== (/\d/.test(a) && /\d/.test(b) ? 9 : -1)) down = false;
  }
  return up || down;
}

/** Every rule the password breaks, in a steady order. An empty list means the password is acceptable (before the breach check). */
export function passwordProblems(input: {
  password: string;
  email?: string;
  current?: string;
}): PasswordProblem[] {
  const { password, email = "", current } = input;
  const found: PasswordProblem[] = [];
  const length = Array.from(password).length;

  if (length < PASSWORD_MIN) found.push("short");
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES)
    found.push("long");

  const lower = password.toLowerCase();
  const simple = lettersAndDigits(lower);
  if (
    COMMON.has(lower) ||
    COMMON.has(simple) ||
    COMMON.has(lettersOnly(lower)) ||
    COMMON.has(simple.replace(/\d+$/, ""))
  )
    found.push("common");

  // The email, or its name part, inside the password. Short names (ann@) are skipped, because they match by chance.
  const address = email.trim().toLowerCase();
  const name = address.split("@")[0] ?? "";
  if (
    address &&
    (lower.includes(address) || (name.length >= 4 && lower.includes(name)))
  )
    found.push("email");

  if (length >= 4 && isPlain(password)) found.push("plain");
  if (current !== undefined && current !== "" && password === current)
    found.push("same");
  return found;
}

/** The one thing to say first. */
export const firstProblem = (problems: PasswordProblem[]): string | null =>
  problems.length ? PASSWORD_WORDS[problems[0]] : null;
