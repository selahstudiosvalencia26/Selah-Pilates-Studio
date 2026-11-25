import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readMigrations } from "./files";

describe("reading a system's SQL files", () => {
  const root = mkdtempSync(join(tmpdir(), "systems-"));
  mkdirSync(join(root, "booking", "migrations"), { recursive: true });
  writeFileSync(join(root, "booking", "migrations", "001_create_tables.sql"), "create table if not exists booking_records ();");

  it("returns the text of a file that exists, and null for one not written yet", () => {
    const files = readMigrations("booking", ["001_create_tables.sql", "002_more.sql"], root);
    expect(files[0]).toEqual({ name: "001_create_tables.sql", sql: "create table if not exists booking_records ();" });
    expect(files[1]).toEqual({ name: "002_more.sql", sql: null });
  });

  it("never reads outside the system's own folder", () => {
    expect(readMigrations("../etc", ["001_create_tables.sql"], root)[0].sql).toBeNull();
    expect(readMigrations("booking", ["../../secret.sql"], root)[0].sql).toBeNull();
    expect(readMigrations("booking", ["001_create_tables.sql/../../x.sql"], root)[0].sql).toBeNull();
  });
});
