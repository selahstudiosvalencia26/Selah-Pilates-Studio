import { getBusiness, setBusinessName } from "@/kit/business";
import { databaseOn, readDocument, writeDocument } from "@/kit/database";
import { DEFAULT_BRANDING, type Branding } from "./branding";

// How the dashboard looks right now, read on the server so the first paint already has the right name, colour and logo and
// nothing flashes. One place, so every page gets it the same way.
//
// With the database set up the saved look is kept there. While you build without one it is kept in memory while the server runs.
const store = globalThis as unknown as { __practiceBranding?: Branding };

// The business name is also shared with every system (src/kit/business.ts), so none of them has to ask for it.
export const savePracticeBranding = (next: Branding): void => {
  store.__practiceBranding = next;
  setBusinessName(next.name);
};

// Until an owner chooses a name, the dashboard shows the one the installer saved (the client's name), not "Your Business".
export async function getBranding(): Promise<Branding> {
  const start = { ...DEFAULT_BRANDING, name: getBusiness().name };
  if (databaseOn()) {
    // A database that cannot be reached must not take the sign-in screen and the whole frame down with it.
    try {
      const saved = (await readDocument("branding")) as Branding | undefined;
      if (saved) setBusinessName(saved.name);
      return saved ?? start;
    } catch (e) {
      console.error("branding could not be read", e instanceof Error ? e.message : "unknown");
      return start;
    }
  }
  if (process.env.NODE_ENV === "production") return start;
  return store.__practiceBranding ?? start;
}

export async function saveLook(next: Branding): Promise<void> {
  if (!databaseOn()) return savePracticeBranding(next);
  await writeDocument("branding", next);
  setBusinessName(next.name);
}
