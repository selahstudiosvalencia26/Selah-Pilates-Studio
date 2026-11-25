import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { databaseOn, readDocument, writeDocument } from "@/kit/database";

// The domain the owner typed in. Kept in a small file while there is no database (USAGE_DATA_DIR, or .data/usage-data,
// which git never sees); when the database is connected, only this file changes. Server only.
export const domainSchema = z.strictObject({
  name: z.string().trim().toLowerCase().max(80).regex(/^([a-z0-9-]+\.)+[a-z]{2,}$|^$/, "Enter a domain like yourshop.com."),
  renewsOn: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Pick the renewal date."),
});
export type Domain = z.infer<typeof domainSchema>;

const file = () => join(resolve(process.env.USAGE_DATA_DIR ?? join(process.cwd(), ".data", "usage-data")), "domain.json");

export async function readDomain(): Promise<Domain> {
  if (databaseOn()) {
    const saved = await readDocument("domain").catch(() => undefined);
    return saved === undefined ? { name: "", renewsOn: "" } : domainSchema.parse(saved);
  }
  try {
    return domainSchema.parse(JSON.parse(await readFile(file(), "utf8")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { name: "", renewsOn: "" };
    throw e;
  }
}

export async function writeDomain(value: Domain): Promise<void> {
  if (databaseOn()) return writeDocument("domain", value);
  const target = file();
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(`${target}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(`${target}.tmp`, target);
}
