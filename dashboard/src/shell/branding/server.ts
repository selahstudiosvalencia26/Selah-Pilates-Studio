import { getBusiness, setBusinessName } from "@/kit/business";
import { DEFAULT_BRANDING, type Branding } from "./branding";

// How the dashboard looks right now, read on the server so the first paint already has the right name, colour and logo and
// nothing flashes. One place, so every page gets it the same way.
//
// While you build (development) the saved look is kept in memory while the server runs, so you can try a name and a logo and
// see them in the menu. On a live site nothing can be saved yet, so it is always the default. Once the database is connected this
// reads shell_settings (brand_name, brand_accent, brand_logo_path) instead.
const store = globalThis as unknown as { __practiceBranding?: Branding };

// The business name is also shared with every system (src/kit/business.ts), so none of them has to ask for it.
export const savePracticeBranding = (next: Branding): void => {
  store.__practiceBranding = next;
  setBusinessName(next.name);
};

// Until an owner chooses a name, the dashboard shows the one the installer saved (the client's name), not "Your Business".
export async function getBranding(): Promise<Branding> {
  const start = { ...DEFAULT_BRANDING, name: getBusiness().name };
  if (process.env.NODE_ENV === "production") return start;
  return store.__practiceBranding ?? start;
}
