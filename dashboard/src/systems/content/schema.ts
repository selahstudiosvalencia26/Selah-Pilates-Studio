import { z } from "zod";

// What the owner may change about the studio on the website, and what is allowed in each field. The messages are plain words,
// because a person reads them. Phone, email and the links may be empty: the website then leaves that part out.
const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Write the ${label}.`)
    .max(max, `The ${label} is too long.`);
const optionalLink = (label: string) =>
  z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(500, `The ${label} is too long.`)
      .regex(
        /^https:\/\/\S+$/,
        `The ${label} must be a full web address, starting with https://`,
      ),
  ]);

export const siteSchema = z.strictObject({
  name: text("name", 60),
  tagline: text("slogan", 80),
  description: text("description", 300),
  street: text("street", 120),
  barangay: text("barangay", 80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Write the postal code as four digits, like 8709."),
  city: text("city", 80),
  province: text("province", 80),
  latitude: z.coerce
    .number()
    .min(-90, "Latitude is between -90 and 90.")
    .max(90, "Latitude is between -90 and 90."),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude is between -180 and 180.")
    .max(180, "Longitude is between -180 and 180."),
  phone: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(
        /^\+?[0-9][0-9 ()-]{6,18}$/,
        "Write the phone number with digits only, like 0917 123 4567.",
      ),
  ]),
  email: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(120, "The email is too long.")
      .email("Write the email like name@example.com."),
  ]),
  facebook: optionalLink("Facebook link"),
  instagram: optionalLink("Instagram link"),
  bookingUrl: optionalLink("booking link"),
});
export type SiteData = z.output<typeof siteSchema>;

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAYS)[number];
export const DAY_NAMES: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time.");
const day = z
  .union([z.literal("closed"), z.strictObject({ open: time, close: time })])
  .superRefine((v, ctx) => {
    if (v !== "closed" && v.close <= v.open)
      ctx.addIssue({
        code: "custom",
        message: "It must close after it opens.",
      });
  });
export const hoursSchema = z.strictObject({
  mon: day,
  tue: day,
  wed: day,
  thu: day,
  fri: day,
  sat: day,
  sun: day,
});
export type HoursData = z.output<typeof hoursSchema>;
