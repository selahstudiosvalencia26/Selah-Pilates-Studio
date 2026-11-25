import { databaseOn, photoBase, readDocument } from "@/kit/database";

// What the website reads while it is being built: the saved words and photo list. Everything here is meant to be public (it is the
// website itself). Nothing else is ever sent: only these names, and only posts and reviews that are switched on.
export const dynamic = "force-dynamic";

const FILES = ["site.json", "hours.json", "home.json", "about.json", "class.json", "contact.json", "classes.json", "photos.json", "blog.json", "reviews.json"];

export async function GET() {
  if (!databaseOn()) return Response.json({ ok: false }, { status: 503 });
  try {
    const files: Record<string, unknown> = {};
    for (const name of FILES) {
      const saved = await readDocument(name);
      if (saved === undefined) continue;
      files[name] = Array.isArray(saved) ? saved.filter((x) => (x as { published?: unknown }).published !== false) : saved;
    }
    return Response.json({ ok: true, files, photoBase: photoBase() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("site content failed", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false }, { status: 503 });
  }
}
