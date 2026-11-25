import { readFileSync } from "node:fs";
import { join } from "node:path";

// The business's own details, for the shell and every system to read, so no system has to ask for the business name again.
//
// Where the name comes from, in order:
//   1. The name set on the Branding screen while the server runs (the shell calls `setBusinessName` when it is saved).
//   2. The name the installer saved when the dashboard was made: setup/business.json in the dashboard folder.
//   3. "Your Business".
// When the database is connected, this is the one place that reads shell_settings.brand_name instead; nothing that calls it changes.
// Server only: it reads a file.
export type Business = { name: string };

export const DEFAULT_BUSINESS: Business = { name: "Your Business" };
const MAX_NAME = 40; // the same limit as the Branding screen

const store = globalThis as unknown as { __businessName?: string };

export function setBusinessName(name: string): void {
  store.__businessName = name;
}

function savedByInstaller(): string | null {
  try {
    const data = JSON.parse(readFileSync(join(process.cwd(), "setup", "business.json"), "utf8")) as { name?: unknown };
    return typeof data.name === "string" && data.name.trim() ? data.name.trim().slice(0, MAX_NAME) : null;
  } catch {
    return null;
  }
}

export function getBusiness(): Business {
  return { name: store.__businessName ?? savedByInstaller() ?? DEFAULT_BUSINESS.name };
}
