// What opens on the live site, checked in the middleware, which runs for every page change. First: is the page there at all (the
// database must be set up; practice pages made for building are never open). Then: may this person open it.

const PRACTICE_ONLY = ["/preview/components", "/preview/slow"];
const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export const databaseReady = (): boolean => Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim());

export const openOnLive = (path: string, ready: boolean): boolean =>
  path === "/" || path === "/preview" || path === "/welcome" || (ready && !PRACTICE_ONLY.some((p) => under(path, p)));

// The permission each part needs. Anything not listed is for the owner only.
const ANYONE = ["/", "/preview", "/preview/account", "/welcome"];
const needs = (path: string): string | null => {
  if (["/booking/settings", "/booking/classes", "/booking/schedule"].some((p) => under(path, p))) return "booking.manage";
  if (under(path, "/booking/new") || /^\/booking\/[^/]+\/edit$/.test(path)) return "booking.edit";
  if (under(path, "/booking")) return "booking.view";
  if (under(path, "/content")) return "content.view";
  return null;
};

export function mayOpen(path: string, who: { owner: boolean; permissions: readonly string[] }): boolean {
  if (who.owner || ANYONE.includes(path)) return true;
  const permission = needs(path);
  return permission !== null && who.permissions.includes(permission);
}
