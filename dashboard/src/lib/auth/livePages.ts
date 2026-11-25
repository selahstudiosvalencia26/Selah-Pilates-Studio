// What a signed-in owner may open on the live site. Everything saves to the database there, so until the database is set up only
// the home page opens. The practice pages made for building are never open. Checked in the middleware, which runs for every page
// change.

const PRACTICE_ONLY = ["/preview/components", "/preview/slow", "/preview/people/roles"];
const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export const databaseReady = (): boolean => Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim());

export const openOnLive = (path: string, ready: boolean): boolean =>
  path === "/" || path === "/preview" || (ready && !PRACTICE_ONLY.some((p) => under(path, p)));
