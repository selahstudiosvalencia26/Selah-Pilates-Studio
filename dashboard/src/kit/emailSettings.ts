import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { databaseOn, readDocument, writeDocument } from "./database";

// The email settings the owner chooses: who emails come from, where staff alerts go, and which emails are switched off or on.
// One place for the shell and every system. Kept in a small file while there is no database (EMAIL_DATA_DIR, or
// .data/email-data, which git never sees); when the database is connected, only this file changes. Server only.
// The sending service's key is never kept here: it lives in the server's own environment.
const address = z.union([z.literal(""), z.email("Enter an email like name@example.com.").max(120)]);

export const emailDetailsSchema = z.strictObject({
  senderName: z.string().trim().max(60, "Keep the name under 60 letters."),
  replyTo: address,
  staffTo: address,
});
export type EmailDetails = z.infer<typeof emailDetailsSchema>;

const settingsSchema = emailDetailsSchema.extend({ switches: z.record(z.string(), z.boolean()) });
export type EmailSettings = z.infer<typeof settingsSchema>;

const file = () => join(resolve(process.env.EMAIL_DATA_DIR ?? join(process.cwd(), ".data", "email-data")), "email.json");

const nothing = (): EmailSettings => ({ senderName: "", replyTo: "", staffTo: "", switches: {} });

export async function readEmailSettings(): Promise<EmailSettings> {
  if (databaseOn()) {
    const saved = await readDocument("email-settings");
    return saved === undefined ? nothing() : settingsSchema.parse(saved);
  }
  try {
    return settingsSchema.parse(JSON.parse(await readFile(file(), "utf8")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return nothing();
    throw e;
  }
}

// One save at a time, written whole, so two quick presses never lose each other's change.
let line: Promise<unknown> = Promise.resolve();

export function changeEmailSettings(change: (s: EmailSettings) => void): Promise<void> {
  const run = line.then(async () => {
    const settings = await readEmailSettings();
    change(settings);
    if (databaseOn()) return writeDocument("email-settings", settings);
    const target = file();
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(`${target}.tmp`, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
    await rename(`${target}.tmp`, target);
  });
  line = run.catch(() => undefined);
  return run;
}

// Is this email switched on? A system asks before it sends. `fallback` is the default in its description file.
export const isEmailOn = (s: EmailSettings, system: string, id: string, fallback: boolean): boolean => s.switches[`${system}:${id}`] ?? fallback;
