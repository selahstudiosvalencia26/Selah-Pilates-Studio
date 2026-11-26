// A ready-made password that is easy to read out and type: three groups of four, without look-alikes (0 o 1 l i).
const LETTERS = "abcdefghjkmnpqrstuvwxyz23456789";

export function tempPassword(): string {
  const picks = new Uint32Array(12);
  crypto.getRandomValues(picks);
  const all = Array.from(picks, (n) => LETTERS[n % LETTERS.length]).join("");
  return `${all.slice(0, 4)}-${all.slice(4, 8)}-${all.slice(8)}`;
}

/** The message to paste into Messenger. */
export const inviteMessage = (name: string, link: string, email: string, password: string, business: string): string =>
  [`Hi ${name}, you can now sign in to the ${business} dashboard.`, `Link: ${link}`, `Email: ${email}`, `Temporary password: ${password}`, "You will choose your own password the first time."].join("\n");
