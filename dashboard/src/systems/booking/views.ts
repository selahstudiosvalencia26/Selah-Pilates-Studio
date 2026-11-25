export const BOOKING_VIEWS = [
  { href: "/booking", title: "List" },
  { href: "/booking/calendar", title: "Calendar" },
];
export const SETTING_VIEWS = [
  { href: "/booking/settings", title: "Booking and deposit" },
  { href: "/booking/settings/preview", title: "Customer view" },
  ...(process.env.NODE_ENV === "production" ? [] : [{ href: "/booking/settings/emails", title: "Emails" }]),
];
