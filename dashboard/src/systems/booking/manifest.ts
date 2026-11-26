import { defineSystem } from "@/shell/systems/manifest";

// Bookings: one system for every kind of business (docs/systems/booking/design.md). A setting picks what people book:
//   venue    a place or room for an event. Customers pick a date and a time, staff confirm, a deposit can hold the date (Dan Cafe).
//   classes  a spot in a class on a weekly timetable. Confirmed at once, until the class is full (Selah).
// Staff screens, the calendar, the rules and the public doors are the same for both.
export default defineSystem({
  id: "booking",
  name: "Bookings",
  version: "0.2.0",
  requires_shell: ">=0.1.0 <1.0.0",
  icon: "calendar",
  needs: [],
  optional: ["payments"],
  pages: [
    // Four tabs (decided 2026-11-25). The others are reached from a small switch on the tab they belong to.
    { path: "/booking", title: "Bookings", permission: "booking.view", nav: true },
    { path: "/booking/schedule", title: "Schedule", permission: "booking.manage", nav: true }, // classes mode only (layout.tsx)
    { path: "/booking/classes", title: "Classes", permission: "booking.manage", nav: true }, // classes mode only (layout.tsx)
    { path: "/booking/settings", title: "Settings", permission: "booking.manage", nav: true },
    { path: "/booking/calendar", title: "Calendar", permission: "booking.view" },
    { path: "/booking/settings/preview", title: "Customer view", permission: "booking.view" },
    { path: "/booking/settings/emails", title: "Emails", permission: "booking.manage" },
    { path: "/booking/new", title: "Add booking", permission: "booking.edit" },
    { path: "/booking/[id]", title: "Booking", permission: "booking.view" },
    { path: "/booking/[id]/edit", title: "Change booking", permission: "booking.edit" },
  ],
  permissions: [
    { id: "booking.view", label: "See bookings", default: ["owner", "manager", "staff"] },
    { id: "booking.edit", label: "Add and change bookings", default: ["owner", "manager", "staff"] },
    { id: "booking.approve", label: "Confirm or decline bookings", default: ["owner", "manager"] },
    { id: "booking.delete", label: "Delete bookings", default: ["owner"] },
    { id: "booking.manage", label: "Change booking settings", default: ["owner"] },
  ],
  tables: ["booking_settings", "booking_records", "booking_version"],
  migrations: ["001_create_tables.sql", "002_prices_and_deposits.sql", "003_save_online.sql"],
  labels: { booking: "Booking" },
  today: [{ id: "new-requests", title: "New booking requests", permission: "booking.view" }],
  emails: [
    { id: "new-request", label: "New booking or receipt", when: "A customer books or sends a receipt", to: "staff", required: false, default: true },
    { id: "request-received", label: "We got your booking", when: "A customer books", to: "customer", required: false, default: true },
    { id: "confirmed", label: "Your booking is confirmed", when: "You mark the payment received", to: "customer", required: false, default: true },
    { id: "declined", label: "Your booking was cancelled", when: "You cancel a booking", to: "customer", required: false, default: true },
    { id: "reminder", label: "A reminder before your booking", when: "1 day before the booking", to: "customer", required: false, default: false },
  ],
  public: [
    { id: "request", method: "POST", fields: ["customerName", "phone", "email", "eventType", "guests", "date", "start", "end", "notes", "sessionKey", "spots"] },
    { id: "availability", method: "GET", fields: [] },
  ],
  search: { table: "booking_records", fields: ["customer_name", "phone"], permission: "booking.view" },
  provides: ["getBooking", "listBookingsForDate"],
});
