import { classes } from "@/content/classes";
import { home } from "@/content/home";
import { hours } from "@/content/hours";
import { pages } from "@/content/pages";
import { metaDescription, site } from "@/content/site";
import { hoursRows } from "@/lib/hours";
import { siteUrl } from "@/lib/seo";

// /llms.txt: the studio's facts in plain text for AI assistants, built from the same files as the pages, so it never disagrees.
export function GET() {
  const a = site.address;
  const lines = [
    `# ${site.name}`,
    "",
    `> ${metaDescription}`,
    "",
    "## Where",
    `${a.street}, ${a.barangay}, ${a.city}, ${a.province} ${a.postalCode}, Philippines`,
    "",
    "## Opening hours",
    ...hoursRows(hours).map((r) => `- ${r.label}: ${r.text}`),
    "",
    "## Classes",
    ...classes.map(
      (c) =>
        `- ${c.name} (${c.group})${c.durationMinutes !== null ? `, ${c.durationMinutes} minutes` : ""}${c.pricePhp !== null ? `, PHP ${c.pricePhp}` : ""}${c.summary ? `. ${c.summary}` : ""}`,
    ),
    "",
    "## Questions",
    ...home.faq.items.flatMap((f) => [`### ${f.q}`, f.a, ""]),
    "## Pages",
    ...pages.map(
      (p) =>
        `- [${p.label}](${siteUrl}${p.href === "/" ? "" : p.href}): ${p.description}`,
    ),
    "",
    "## Contact",
    ...[
      site.phone ? `- Phone: ${site.phone}` : "",
      site.email ? `- Email: ${site.email}` : "",
      site.facebook ? `- Facebook: ${site.facebook}` : "",
      site.instagram ? `- Instagram: ${site.instagram}` : "",
    ].filter(Boolean),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
