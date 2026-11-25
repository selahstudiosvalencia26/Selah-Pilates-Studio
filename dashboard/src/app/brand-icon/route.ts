import { getBranding } from "@/shell/branding/server";

// The dashboard's tab icon while the business has no logo yet: its first letter on a solid tile, the same mark the menu shows (BrandMark).
// Once a logo is added, the tab uses the logo itself (layout.tsx) and this is not asked for. An SVG, so it is sharp at every size.
export const dynamic = "force-dynamic";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export async function GET() {
  const { name } = await getBranding();
  const letter = escape((Array.from(name.trim())[0] ?? "?").toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f1419"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${letter}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" } });
}
