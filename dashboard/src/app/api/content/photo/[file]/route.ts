import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { databaseOn, photoBase } from "@/kit/database";
import { signedIn } from "@/kit/session";
import { uploadsDir } from "@/systems/content/store";

// Shows a saved website photo inside the dashboard, so the owner sees what they added. The photo files live in the website's folder,
// so the dashboard reads them from there. The name must look exactly like one we made (12 letters and numbers, then .webp), so
// nothing else on the computer can be asked for.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  // On a live site only someone signed in gets this far (the middleware), and it is checked again here.
  if (!(await signedIn())) return new Response(null, { status: 404 });
  const { file } = await params;
  if (!/^[a-f0-9]{12}\.webp$/.test(file))
    return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(join(uploadsDir(), file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Not among the committed photos: one added on the live site is in storage.
    if (databaseOn()) return Response.redirect(`${photoBase()}${file}`, 302);
    return new Response(null, { status: 404 });
  }
}
