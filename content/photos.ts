// The photos the owner has added, by the place they go (see the dashboard's Website screen). The starting point is
// content/data/photos.json (what a build for the live site uses). While you work (npm run dev) the dashboard saves to
// content/local/photos.json instead, and it is read fresh on every request here, so a photo added in the dashboard shows after a
// reload with nothing to restart. The picture files are in public/uploads/photos.
// A place with no saved photo keeps showing its "Photo to add" frame. Server only: do not import this from a client component.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import data from "./data/photos.json";

type Saved = { file: string; alt: string; x?: number; y?: number };

function saved(): Record<string, Saved> {
  if (process.env.NODE_ENV !== "production") {
    try {
      return JSON.parse(
        readFileSync(join(process.cwd(), "content", "local", "photos.json"), "utf8"),
      ) as Record<string, Saved>;
    } catch {
      /* no local copy yet: use the committed one */
    }
  }
  return data as unknown as Record<string, Saved>;
}

// `position` is the part of the photo that stays in view when the frame crops it (CSS object-position).
export function savedPhoto(
  slot: string,
): { src: string; alt: string; position: string } | null {
  const p = saved()[slot];
  return p
    ? {
        src: `/uploads/photos/${p.file}`,
        alt: p.alt,
        position: `${p.x ?? 50}% ${p.y ?? 50}%`,
      }
    : null;
}
