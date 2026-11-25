import { z } from "zod";
import { WEEKDAYS } from "./time";

// What a booking is, and what the venue's settings are. Every input from a person or from the website is checked against these
// on the server. A strict object refuses any extra field, so nobody can slip one in (docs/rules/security.md).

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 18:00.");
const day = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Use a date.");
const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} letters.`);

export const STATUSES = ["requested", "confirmed", "done", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export const DEPOSIT = ["none", "waiting", "paid", "void"] as const;
export type DepositStatus = (typeof DEPOSIT)[number];

export const METHODS = ["gcash", "maya", "ewallet", "bank", "cash"] as const;
export type Method = (typeof METHODS)[number];
export const METHOD_NAMES: Record<Method, string> = { gcash: "GCash", maya: "Maya", ewallet: "Other e-wallet", bank: "Bank transfer", cash: "Cash" };

// The fields a customer or staff member fills in. The date and times are the business's own clock.
export const fieldsSchema = z.strictObject({
  customerName: text(80).min(1, "Enter a name."),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a phone number we can call."),
  email: z.email("Enter an email like name@example.com.").max(120),
  eventType: text(40).min(1, "Say what the event is."),
  guests: z.number().int("Use a whole number.").min(1, "Enter how many guests.").max(5000),
  date: day,
  endDate: day.optional(), // the last day, when the booking runs over several days
  start: clock,
  end: clock,
  notes: text(500).default(""),
  packageId: z.string().regex(/^[a-f0-9]{8}$/).optional(), // the package picked, when the venue charges by package
});
export type Fields = z.infer<typeof fieldsSchema>;

// What the website sends. `website` is a hidden box a real person never fills, so a filled one means a bot.
export const requestSchema = fieldsSchema.extend({ website: z.string().max(200).optional() });

export const noteSchema = text(300);

const hours = z
  .union([z.literal("closed"), z.strictObject({ open: clock, close: clock })])
  .refine((v) => v === "closed" || v.open < v.close, "Closing time must be after opening time.");

export const MODES = ["venue", "classes"] as const;
export type Mode = (typeof MODES)[number];

// One line of a weekly class timetable ("Mondays 9:00, Sculpt, 55 minutes, 12 spots"). The classes of any date come from these.
export const classSchema = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{8}$/),
  weekday: z.enum(WEEKDAYS),
  time: clock,
  minutes: z.number().int().min(5, "Use at least 5 minutes.").max(600),
  title: text(60).min(1, "Enter a class name."),
  kind: z.enum(["class", "session"]).optional(), // a group class (the default) or a private session
  instructor: text(60),
  place: text(60),
  capacity: z.number().int().min(1, "Use at least 1 slot.").max(500),
  price: z.number().int("Enter a price like 500.").min(0, "Enter a price like 500.").max(100_000_000).optional(), // centavos for one spot
});
export type ClassEntry = z.infer<typeof classSchema>;

// The ways a deposit can be sent. A QR picture is kept as data and checked for what it really is.
export const MAX_QR_CHARS = 400_000; // about 300 KB
const picture = z
  .string()
  .max(MAX_QR_CHARS, "That picture is too big.")
  .refine((v) => v === "" || /^data:image\/(png;base64,iVBORw0KGgo|jpeg;base64,\/9j\/)[A-Za-z0-9+/]*={0,2}$/.test(v), "Use a PNG or JPG picture.");
export const PAY_KINDS = ["gcash", "maya", "ewallet", "bank"] as const;
export type PayKind = (typeof PAY_KINDS)[number];
export const PAY_KIND_NAMES: Record<PayKind, string> = { gcash: "GCash", maya: "Maya", ewallet: "Other e-wallet", bank: "Bank account" };
export const payAccountSchema = z
  .strictObject({
    id: z.string().regex(/^[a-f0-9]{8}$/),
    kind: z.enum(PAY_KINDS),
    provider: text(40), // the bank or e-wallet's name, for the two kinds that need one
    name: text(80).min(1, "Enter the account name."),
    number: z.string().trim().max(30).regex(/^[\d\s+-]*$/, "Use numbers only for the account or mobile number."),
    qr: picture,
  })
  .refine((a) => (a.kind !== "bank" && a.kind !== "ewallet") || a.provider !== "", "Enter the name of the bank or e-wallet.")
  .refine((a) => a.number !== "" || a.qr !== "", "Add a number or a QR picture.")
  .refine((a) => (a.kind !== "gcash" && a.kind !== "maya") || a.number === "" || /^(09|\+639)\d{9}$/.test(a.number.replace(/[\s-]/g, "")), "Enter a mobile number like 0917 123 4567.");
export type PayAccount = z.infer<typeof payAccountSchema>;
export const payLabel = (a: Pick<PayAccount, "kind" | "provider">): string => (a.kind === "gcash" || a.kind === "maya" ? PAY_KIND_NAMES[a.kind] : a.provider);

const money = z.number().int("Enter an amount like 5000.").min(0, "Enter an amount like 5000.").max(100_000_000); // centavos
export const packageSchema = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{8}$/),
  name: text(60).min(1, "Give the package a name."),
  hours: z.number().int("Use whole hours.").min(1, "A package lasts at least 1 hour.").max(24),
  price: money.min(1, "Enter the package price."),
});
export const settingsSchema = z.strictObject({
  priceType: z.enum(["none", "hour", "package"]).default("none"),
  hourPrice: money.default(0),
  packages: z.array(packageSchema).max(10).default([]),
  depositKind: z.enum(["fixed", "percent"]).default("fixed"),
  depositPercent: z.number().int("Use a whole number.").min(1, "Use 1 to 100.").max(100, "Use 1 to 100.").default(30),
  mode: z.enum(MODES),
  venue: text(80).min(1, "Enter the venue name."),
  slotMinutes: z.number().int().min(15).max(120), // how far apart start times are in the time picker (venue mode)
  timetable: z.array(classSchema).max(200), // classes mode
  zone: z.string().min(3).max(60),
  hours: z.strictObject(Object.fromEntries(WEEKDAYS.map((d) => [d, hours])) as Record<(typeof WEEKDAYS)[number], typeof hours>),
  closedDates: z.array(day).max(366),
  leadDays: z.number().int().min(0, "Use 0 or more.").max(365),
  maxGuests: z.number().int().min(1, "Use 1 or more.").max(5000),
  depositRequired: z.boolean(),
  maxDays: z.number().int("Use a whole number.").min(1, "Use 1 or more.").max(14, "Use 14 days or fewer.").default(3), // 1 means one day at a time
  dayPrice: z.number().int("Enter an amount like 5000.").min(0, "Enter an amount like 5000.").max(100_000_000).default(0), // centavos for each day of a several-day booking
  holdWhilePaying: z.boolean().default(true), // a time someone is paying for is not offered to others
  depositWhen: z.enum(["request", "confirm"]).default("request"), // ask as soon as a customer sends, or only after staff confirm
  depositAmount: z.number().int("Use a whole number of centavos.").min(0).max(100_000_000), // centavos, never a decimal
  depositHours: z.number().int("Use a whole number.").min(0, "Use 0 or more.").max(720, "Use 720 hours or less.").default(48), // time to pay, 0 is no limit
  payAccounts: z.array(payAccountSchema).max(5).default([]),
})
  .refine((s) => s.priceType !== "hour" || s.hourPrice > 0, "Enter the price for one hour.")
  .refine((s) => s.priceType !== "package" || s.packages.length > 0, "Add at least one package.");
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  mode: "venue",
  venue: "Venue",
  slotMinutes: 30,
  timetable: [],
  zone: "Asia/Manila",
  hours: Object.fromEntries(WEEKDAYS.map((d) => [d, { open: "09:00", close: "21:00" }])) as Settings["hours"],
  closedDates: [],
  leadDays: 2,
  maxGuests: 50,
  depositRequired: true,
  depositWhen: "request",
  maxDays: 3,
  dayPrice: 0,
  holdWhilePaying: true,
  depositAmount: 500_000,
  depositHours: 48,
  payAccounts: [],
  priceType: "none",
  hourPrice: 0,
  packages: [],
  depositKind: "fixed",
  depositPercent: 30,
};

export const bookingSchema = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{12}$/),
  customerName: z.string(),
  phone: z.string(),
  email: z.string(),
  eventType: z.string(),
  guests: z.number().int(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  sessionKey: z.string().regex(/^[a-f0-9]{8}@\d{4}-\d{2}-\d{2}$/).nullable(), // the class and date this spot is in (classes mode)
  status: z.enum(STATUSES),
  deposit: z.enum(DEPOSIT),
  depositAmount: z.number().int().min(0), // centavos
  depositMethod: z.enum(METHODS).nullable(),
  depositPaidOn: day.nullable(),
  payBy: z.iso.datetime().optional(), // when the deposit is due
  price: z.number().int().min(0).optional(), // centavos, kept from the day it was booked
  packageName: z.string().optional(),
  notes: z.string(),
  staffNote: z.string(),
  createdVia: z.enum(["public", "staff"]),
  createdAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
  history: z.array(z.strictObject({ at: z.iso.datetime(), what: z.string() })),
});
export type Booking = z.infer<typeof bookingSchema>;

export const bookingsSchema = z.array(bookingSchema);
