// Where the Book buttons go, and where the booking page sends bookings.
// NEXT_PUBLIC_DASHBOARD_URL is the address of the studio's dashboard. While building it is the dashboard on this computer. On the
// live site, until that address is set, online booking is off and the buttons go to the Contact page as before.
import { site } from "@/content/site";

export const bookingApi =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3101" : "");

/** An outside booking link set in Site information wins over everything. Until online booking is on, "Book" shows the classes. */
export const bookHref = site.bookingUrl ?? (bookingApi ? "/book" : "/class");

/** Where to ask for a booking once someone is already looking at the classes. */
export const askHref = site.bookingUrl ?? (bookingApi ? "/book" : "/contact");

/** The Book link for one class: the booking page opens with that class already picked. */
export const bookClassHref = (name: string) =>
  bookHref === "/book" ? `/book?class=${encodeURIComponent(name)}` : bookHref;
