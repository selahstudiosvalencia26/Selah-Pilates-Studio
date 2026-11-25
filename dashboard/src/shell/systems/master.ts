import { existsSync } from "node:fs";
import { join } from "node:path";

// Is this the master dashboard, where systems are added? A client's copy leaves the installer behind
// (scripts/refresh.mjs, CLIENT_REMOVED_SCRIPTS), so it never offers to add one. Server only.
export const isMaster = (): boolean => existsSync(join(process.cwd(), "scripts", "mdash.mjs"));
