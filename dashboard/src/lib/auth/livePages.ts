// What a signed-in owner may open on the live site: only the parts that really save online. Everything else still reads local
// files or sample data, so it is not shown. Checked in the middleware, which runs for every page change; a page frame does not,
// because it stays as it is while someone clicks around.

const NOT_YET = ["/booking/classes", "/booking/settings/emails"];
const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export const bookingOnline = (): boolean => Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim());

/** The home page, and Bookings once the database is set up. */
export const openOnLive = (path: string, bookingReady: boolean): boolean =>
  path === "/" || path === "/preview" || (bookingReady && under(path, "/booking") && !NOT_YET.some((c) => under(path, c)));
