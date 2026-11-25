import { CANDIDATES } from "@/systems";
import { checkSystem } from "./systems/installCheck";
import type { Manifest } from "./systems/manifest";

// The dashboard's own version. A system says which versions it works with (requires_shell).
export const SHELL_VERSION = "0.1.0";

export type Candidate = { folder: string; manifest: unknown };
export type Failed = { folder: string; problems: string[] };

// Inspect every system folder. Those that pass are on; those that fail stay off, with their reasons in plain words.
// Order matters only for clashes: the first system to claim a name keeps it.
export function loadSystems(candidates: readonly Candidate[] = CANDIDATES, shellVersion: string = SHELL_VERSION): { systems: Manifest[]; failed: Failed[] } {
  const installed = candidates.map((c) => c.folder);
  const systems: Manifest[] = [];
  const failed: Failed[] = [];
  for (const c of candidates) {
    const result = checkSystem(c.manifest, { folder: c.folder, shellVersion, installed, others: systems });
    if (result.manifest) systems.push(result.manifest);
    else failed.push({ folder: c.folder, problems: result.problems });
  }
  return { systems, failed };
}
