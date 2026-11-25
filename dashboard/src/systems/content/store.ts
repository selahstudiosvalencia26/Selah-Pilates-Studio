import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { databaseOn, readDocument, writeDocument } from "@/kit/database";
import { PAGES, type PageKind } from "./site/pages";
import { publishSoon } from "./publish";
import { classListSchema, type ClassList } from "./site/classList";
import { photosSchema, type Photos } from "./photoRules";
import { itemSchemaFor, type ListDef, type ListItem } from "./listDef";
import { z } from "zod";
import {
  hoursSchema,
  siteSchema,
  type HoursData,
  type SiteData,
} from "./schema";

// Where the website's content is kept, and the rule that keeps test changes off the live site.
//
//   <website>/content/data/*.json    the committed content. The live site is built from these files and nothing else.
//   <website>/content/local/*.json   what this dashboard saves (never committed). The website reads it only while it runs
//                                    locally (npm run dev), so what you try here is seen here.
//
// Reading: the local copy if there is one, otherwise the committed file (the starting point). Writing: always the local folder.
// So a change made here can never reach the live site by accident. (When the database is connected, this file is the only thing
// that changes: saving there becomes publishing, on purpose.)
//
// The dashboard sits in a folder called dashboard inside the website's folder, so the website is one level up
// (docs/architecture/client-setup.md in the master). WEBSITE_DIR points somewhere else.
const websiteRoot = () =>
  resolve(process.env.WEBSITE_DIR ?? join(process.cwd(), ".."));
const committedDir = () => join(websiteRoot(), "content", "data");
const localDir = () =>
  resolve(
    process.env.WEBSITE_CONTENT_DIR ?? join(websiteRoot(), "content", "local"),
  );

// With the database set up (a live site), saves go there and the committed file is only the starting point. The website picks the
// saved words up when it is published (see ./publish.ts).
async function read<T>(file: string, parse: (v: unknown) => T): Promise<T> {
  if (databaseOn()) {
    const saved = await readDocument(file);
    return parse(saved !== undefined ? saved : JSON.parse(await readFile(join(committedDir(), file), "utf8")));
  }
  let text: string;
  try {
    text = await readFile(join(localDir(), file), "utf8");
  } catch {
    text = await readFile(join(committedDir(), file), "utf8");
  }
  return parse(JSON.parse(text));
}

// Write a whole file at once: to a temporary name, then renamed, so a stopped save never leaves half a file.
async function write(file: string, value: unknown) {
  if (databaseOn()) {
    await writeDocument(file, value);
    publishSoon();
    return;
  }
  await mkdir(localDir(), { recursive: true });
  const target = join(localDir(), file);
  await writeFile(
    `${target}.tmp`,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
  await rename(`${target}.tmp`, target);
}

export const readSite = () => read("site.json", (v) => siteSchema.parse(v));
export const writeSite = (v: SiteData) => write("site.json", v);
export const readHours = () => read("hours.json", (v) => hoursSchema.parse(v));
export const writeHours = (v: HoursData) => write("hours.json", v);

// The words of one page of the website (Home, About, Class or Contact): one file each.
export const readPage = (kind: PageKind) =>
  read(PAGES[kind].file, (v) => PAGES[kind].schema.parse(v));
export const writePage = (kind: PageKind, v: unknown) =>
  write(PAGES[kind].file, v);

// The photos added to the website's photo places: which file and what description, for each place (photos.json). The picture files
// are kept in the website's public folder, so the website serves them like any image. (When the database is connected they move to
// storage; only this part changes.)
export const readPhotos = () =>
  read("photos.json", (v) => photosSchema.parse(v));
export const writePhotos = (v: Photos) => write("photos.json", v);
export const uploadsDir = () =>
  resolve(
    process.env.WEBSITE_UPLOADS_DIR ??
      join(websiteRoot(), "public", "uploads", "photos"),
  );

// The classes and private sessions (classes.json).
export const readClasses = () =>
  read("classes.json", (v) => classListSchema.parse(v));
export const writeClasses = (v: ClassList) => write("classes.json", v);

// A list of the website (the classes, the menu, the projects...): one file each, named by the client's list description. A list
// that has no file yet is empty. Reading does not hold a list to its minimum or maximum (an empty new list must open); saving does.
export async function readList(def: ListDef): Promise<ListItem[]> {
  try {
    return await read(def.file, (v) => z.array(itemSchemaFor(def)).parse(v) as ListItem[]);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}
export const writeList = (def: ListDef, v: ListItem[]) => write(def.file, v);
