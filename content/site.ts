// Business facts. The values the owner can change live in content/data/site.json (the dashboard edits that file for now, and the
// database later). Anything not given by the client is empty there and null here, and is listed in `missing`.
import data from "./data/site.json";

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

export const site = {
  name: data.name,
  kind: "Fitness and sports",
  tagline: orNull(data.tagline) as string | null,
  description: orNull(data.description) as string | null,
  address: {
    street: data.street,
    barangay: data.barangay,
    postalCode: data.postalCode,
    city: data.city,
    province: data.province,
    country: "PH",
  },
  // Map pin, from the owner.
  geo: { latitude: data.latitude, longitude: data.longitude },
  phone: orNull(data.phone) as string | null,
  email: orNull(data.email) as string | null,
  facebook: orNull(data.facebook) as string | null,
  instagram: orNull(data.instagram) as string | null,
  owner: "Ciara Bergado",
  // Where the Book buttons go. If null, they go to the Contact page.
  bookingUrl: orNull(data.bookingUrl) as string | null,
  goals: [
    "More bookings or appointments",
    "More sales",
    "Better brand credibility",
  ],
  // Used only until the client gives a real description.
  fallbackDescription: "Pilates studio in Valencia City, Bukidnon.",
  missing: [
    "Phone number",
    "Email address",
    "Short story of the studio (the booking portal description is used for now)",
    "Pilates benefits, who-it-is-for and questions text on the home page is general draft copy, to review",
    "Ciara Bergado: her role, a short story and a photo she is happy to share",
    "Photos of each class",
    "Real photos of the studio and classes",
    "Brand colours (the logo file is added)",
    "How people book today (message, call or form)",
    "Cancellation and late rules",
    "Confirm the meaning of the name Selah (About page, draft)",
    "Terms and cancellation rules (the booking portal has them; link or copy)",
    "Final list of pages",
    "Package and domain name",
  ],
};

export const metaDescription = site.description ?? site.fallbackDescription;
