// The classes and private sessions. The list lives in content/data/classes.json (the dashboard edits that file for now, and the
// database later): name, kind, note, level, focus, length and price. A class's photo is looked up by its slug (the `slot` on the
// class card), so nothing about photos is read here.
import data from "./data/classes.json";

export type Class = {
  slug: string;
  name: string;
  group: "Group mat class" | "Private reformer session";
  summary: string | null;
  level: string | null;
  focus: string | null;
  durationMinutes: number | null;
  pricePhp: number | null;
  image: string | null;
};

type Row = {
  slug: string;
  name: string;
  group: string;
  summary: string;
  level: string;
  focus: string;
  durationMinutes: number | null;
  pricePhp: number | null;
};

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

export const classes: Class[] = (data as Row[]).map((c) => ({
  slug: c.slug,
  name: c.name,
  group:
    c.group === "Private reformer session"
      ? "Private reformer session"
      : "Group mat class",
  summary: orNull(c.summary),
  level: orNull(c.level),
  focus: orNull(c.focus),
  durationMinutes: c.durationMinutes,
  pricePhp: c.pricePhp,
  image: null,
}));
