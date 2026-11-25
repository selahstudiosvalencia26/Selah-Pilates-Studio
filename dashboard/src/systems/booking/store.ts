import { readFileSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { getBusiness } from "@/kit/business";
import { bookingsSchema, DEFAULT_SETTINGS, settingsSchema, type Booking, type Settings } from "./schema";

// Where bookings are kept while there is no database: two small files (bookings.json, settings.json) in one folder.
// When the database is connected, this file is the only one that changes (docs/systems/booking/design.md); everything else
// asks for data through `withData` and never knows where it lives.
//
// The folder is BOOKING_DATA_DIR, or .data/booking-data inside the dashboard, which git never sees. Never inside .next: Next.js clears that when it starts, and the bookings would be lost.
export const dataDir = () => resolve(process.env.BOOKING_DATA_DIR ?? join(process.cwd(), ".data", "booking-data"));

async function readFileOr<T>(file: string, parse: (v: unknown) => T, fallback: T): Promise<T> {
  try {
    return parse(JSON.parse(await readFile(join(dataDir(), file), "utf8")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw e;
  }
}

// A whole file at once: to a temporary name, then renamed, so a stopped save never leaves half a file.
async function writeJson(file: string, value: unknown) {
  await mkdir(dataDir(), { recursive: true });
  const target = join(dataDir(), file);
  await writeFile(`${target}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(`${target}.tmp`, target);
}

// The first settings. The business name is the dashboard's own (getBusiness, from the toolbox), so Bookings never asks for it. The rest comes
// from the answers given when the system was installed (setup/booking.json, written by `install-system`; the questions are in setup.json).
// Used only until the settings are saved for the first time. A missing or odd answers file changes nothing: the plain defaults apply.
export function startingSettings(): Settings {
  const plain: Settings = { ...DEFAULT_SETTINGS, venue: getBusiness().name };
  try {
    const a = JSON.parse(readFileSync(join(process.cwd(), "setup", "booking.json"), "utf8")) as Record<string, unknown>;
    const mode = a.mode === "classes" || a.mode === "venue" ? a.mode : plain.mode;
    const depositRequired = a.deposit === "no" ? false : plain.depositRequired;
    const parsed = settingsSchema.safeParse({ ...plain, mode, depositRequired, ...(mode === "classes" ? { depositRequired: false, depositAmount: 0 } : {}) });
    return parsed.success ? parsed.data : plain;
  } catch {
    return plain;
  }
}

// An earlier version kept one GCash entry. It becomes the first way to pay.
function upgrade(saved: unknown): unknown {
  if (typeof saved !== "object" || saved === null || !("gcash" in saved)) return saved;
  const { gcash, ...rest } = saved as { gcash?: { name?: string; number?: string; qr?: string } };
  const used = gcash?.name && (gcash.number || gcash.qr);
  return used ? { ...rest, payAccounts: [{ id: "00000001", kind: "gcash", provider: "", name: gcash.name, number: gcash.number ?? "", qr: gcash.qr ?? "" }] } : rest;
}

export type Data = { bookings: Booking[]; settings: Settings };

// Every read and write goes through one line, so two people pressing at once are handled one after the other. The second one then
// sees the first one's change, which is what lets "two staff confirm the same slot" refuse the second. If `change` throws, nothing is saved.
let line: Promise<unknown> = Promise.resolve();

export function withData<T>(change: (data: Data) => T | Promise<T>): Promise<T> {
  const run = line.then(async () => {
    const data: Data = {
      bookings: await readFileOr("bookings.json", (v) => bookingsSchema.parse(v), []),
      settings: await readFileOr("settings.json", (v) => settingsSchema.parse(upgrade(v)), startingSettings()),
    };
    const before = { bookings: JSON.stringify(data.bookings), settings: JSON.stringify(data.settings) };
    const result = await change(data);
    if (JSON.stringify(data.bookings) !== before.bookings) await writeJson("bookings.json", data.bookings);
    if (JSON.stringify(data.settings) !== before.settings) await writeJson("settings.json", data.settings);
    return result;
  });
  line = run.catch(() => undefined);
  return run;
}

// A copy to look at. Changing it changes nothing.
export const readData = (): Promise<Data> => withData((data) => structuredClone(data));
