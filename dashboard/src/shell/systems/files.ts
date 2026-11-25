import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Reads a system's SQL files from disk, for the Database updates part of the Systems page. Server only.
// Only a plain system word and a numbered .sql name are ever turned into a path, so nothing can reach outside the
// system's own migrations folder.
const FOLDER = /^[a-z]{2,20}$/;
const FILE = /^\d{3}_[a-z0-9_]+\.sql$/;

export type MigrationFile = { name: string; sql: string | null }; // sql is null when the file has not been written yet

export function readMigrations(folder: string, names: readonly string[], root: string = join(process.cwd(), "src", "systems")): MigrationFile[] {
  return names.map((name) => {
    if (!FOLDER.test(folder) || !FILE.test(name)) return { name, sql: null };
    const path = join(root, folder, "migrations", name);
    return { name, sql: existsSync(path) ? readFileSync(path, "utf8") : null };
  });
}
