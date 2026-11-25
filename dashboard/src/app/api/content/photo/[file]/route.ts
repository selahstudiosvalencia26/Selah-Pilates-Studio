import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { uploadsDir } from "@/systems/content/store";

// Shows a saved website photo inside the dashboard, so the owner sees what they added. The photo files live in the website's folder,
// so the dashboard reads them from there. The name must look exactly like one we made (12 letters and numbers, then .webp), so
// nothing else on the computer can be asked for. Not available on a live site.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  if (process.env.NODE_ENV === "production")
    return new Response(null, { status: 404 });
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
    return new Response(null, { status: 404 });
  }
}
