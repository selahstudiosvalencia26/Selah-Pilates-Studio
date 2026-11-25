// Runs before the website is built (npm run build). With CONTENT_URL set (the dashboard's address), the words and photos saved in
// the dashboard replace the starting ones in content/data. Without it nothing happens. If the dashboard cannot be reached the build
// stops, so the website keeps what it already shows instead of going back to old words.
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = (process.env.CONTENT_URL ?? "").trim().replace(/\/$/, "");
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
