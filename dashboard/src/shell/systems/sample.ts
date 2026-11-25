import { defineSystem } from "./manifest";

// Three example systems for the dashboard's own tests and previews. The real systems live on their system/<id> branches
// (docs/architecture/branching.md), so the dashboard's tests must not depend on them. These stand in for any system.

const booking = defineSystem({
  id: "booking",
  name: "Bookings",
  version: "0.1.0",
  requires_shell: ">=0.1.0 <1.0.0",
  icon: "calendar",
  needs: [],
  optional: ["payments"],
  pages: [
    { path: "/booking", title: "All bookings", permission: "booking.view", nav: true },
    { path: "/booking/calendar", title: "Calendar", permission: "booking.view", nav: true },
    { path: "/booking/[id]", title: "Booking", permission: "booking.view" },
    { path: "/booking/settings", title: "Settings", permission: "booking.manage", nav: true },
  ],
  permissions: [
    { id: "booking.view", label: "See bookings", default: ["owner", "manager", "staff"] },
    { id: "booking.edit", label: "Add and change bookings", default: ["owner", "manager", "staff"] },
    { id: "booking.approve", label: "Confirm or decline bookings", default: ["owner", "manager"] },
    { id: "booking.delete", label: "Delete bookings", default: ["owner"] },
    { id: "booking.manage", label: "Change booking settings", default: ["owner"] },
  ],
  tables: ["booking_resources", "booking_hours", "booking_records"],
  migrations: ["001_create_tables.sql"],
  labels: { booking: "Booking" },
  today: [{ id: "new-requests", title: "New booking requests", permission: "booking.view" }],
  emails: [
    { id: "request-received", label: "We got your request", to: "customer", required: false, default: true },
    { id: "confirmed", label: "Your booking is confirmed", to: "customer", required: false, default: true },
    { id: "declined", label: "Your booking could not be confirmed", to: "customer", required: false, default: true },
    { id: "reminder", label: "A reminder before the event", to: "customer", required: false, default: true },
  ],
  public: [
    { id: "request", method: "POST", fields: ["name", "phone", "email", "event_type", "guests", "starts_at", "ends_at", "notes"] },
    { id: "availability", method: "GET", fields: [] },
  ],
  search: { table: "booking_records", fields: ["customer_name", "phone"], permission: "booking.view" },
  provides: ["getBooking", "listBookingsForDate"],
});

const content = defineSystem({
  id: "content",
  name: "Website",
  version: "0.1.0",
  requires_shell: ">=0.1.0 <1.0.0",
  icon: "globe",
  needs: ["files"],
  optional: [],
  pages: [
    { path: "/content", title: "Pages", permission: "content.view", nav: true },
    { path: "/content/menu", title: "Menu", permission: "content.view", nav: true },
    { path: "/content/gallery", title: "Gallery", permission: "content.view", nav: true },
    { path: "/content/announcement", title: "Announcement", permission: "content.view", nav: true },
    { path: "/content/[slug]", title: "Edit page", permission: "content.edit" },
  ],
  permissions: [
    { id: "content.view", label: "See the website content", default: ["owner", "manager", "staff"] },
    { id: "content.edit", label: "Edit the website content", default: ["owner", "manager"] },
    { id: "content.approve", label: "Publish changes to the website", default: ["owner", "manager"] },
    { id: "content.manage", label: "Change how the website is organized", default: ["owner"] },
  ],
  tables: ["content_pages", "content_blocks", "content_media"],
  migrations: ["001_create_tables.sql"],
  labels: {},
  today: [{ id: "unpublished", title: "Unpublished changes", permission: "content.view" }],
  emails: [],
  public: [
    { id: "page", method: "GET", fields: [] },
    { id: "site", method: "GET", fields: [] },
  ],
  search: { table: "content_pages", fields: ["title"], permission: "content.view" },
  provides: ["getPublishedPage", "getSiteInfo"],
});

const payments = defineSystem({
  id: "payments",
  name: "Payments",
  version: "0.1.0",
  requires_shell: ">=0.1.0 <1.0.0",
  icon: "wallet",
  needs: ["files"],
  optional: ["booking"],
  pages: [
    { path: "/payments", title: "All payments", permission: "payments.view", nav: true },
    { path: "/payments/[id]", title: "Payment", permission: "payments.view" },
    { path: "/payments/settings", title: "Settings", permission: "payments.manage", nav: true },
  ],
  permissions: [
    { id: "payments.view", label: "See payments", default: ["owner", "manager", "staff"] },
    { id: "payments.edit", label: "Record a payment", default: ["owner", "manager", "staff"] },
    { id: "payments.approve", label: "Void a payment", default: ["owner", "manager"] },
    { id: "payments.manage", label: "Change payment settings", default: ["owner"] },
  ],
  tables: ["payments_records"],
  migrations: ["001_create_tables.sql"],
  labels: {},
  today: [{ id: "deposits-waiting", title: "Deposits waiting", permission: "payments.view" }],
  emails: [],
  public: [],
  search: { table: "payments_records", fields: ["note"], permission: "payments.view" },
  provides: ["recordPayment", "getPaymentsFor", "getDepositStatus"],
});

export const SAMPLE_CANDIDATES: { folder: string; manifest: unknown }[] = [
  { folder: "booking", manifest: booking },
  { folder: "content", manifest: content },
  { folder: "payments", manifest: payments },
];
