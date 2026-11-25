// Runs before the website is built (npm run build). On the live site (or with CONTENT_URL set), the words and photos saved in
// the dashboard replace the starting ones in content/data. Elsewhere nothing happens. If the dashboard cannot be reached the build
// stops, so the website keeps what it already shows instead of going back to old words.
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// On Vercel the studio's own dashboard is used, so there is nothing to set up. CONTENT_URL can point somewhere else.
const live = process.env.VERCEL_ENV === "production" ? "https://selah-pilates-studio-dashboard.vercel.app" : "";
const base = (process.env.CONTENT_URL || live).trim().replace(/\/$/, "");
if (base) {
  const answer = await fetch(`${base}/api/site-content`);
  const data = answer.ok ? await answer.json() : null;
  if (!data?.ok) throw new Error(`Could not get the saved words from the dashboard (${answer.status}).`);

  for (const [name, value] of Object.entries(data.files)) {
    if (!/^[a-z]+\.json$/.test(name)) continue;
    await writeFile(join("content", "data", name), `${JSON.stringify(value, null, 2)}\n`);
  }

  const folder = join("public", "uploads", "photos");
  await mkdir(folder, { recursive: true });
  for (const photo of Object.values(data.files["photos.json"] ?? {})) {
    if (!/^[a-f0-9]{12}\.webp$/.test(photo.file)) continue;
    const target = join(folder, photo.file);
    if (await access(target).then(() => true, () => false)) continue;
    const picture = await fetch(`${data.photoBase}${photo.file}`);
    if (!picture.ok) throw new Error(`Could not get the photo ${photo.file} (${picture.status}).`);
    await writeFile(target, Buffer.from(await picture.arrayBuffer()));
  }
  console.log(`Took ${Object.keys(data.files).length} saved files from the dashboard.`);
}
