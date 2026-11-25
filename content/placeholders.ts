// Stand-ins for words the studio has not given yet. The words are edited in the dashboard (Website). While a line still says
// "coming soon", a build for the live site leaves it out, and while building (npm run dev) a marked placeholder shows its place.
// As soon as real words are saved, they show everywhere.
export const PLACEHOLDERS = process.env.NODE_ENV !== "production";

export const STORY_PLACEHOLDER =
  "Placeholder: tell how the studio started, who it is for, and what a visit feels like.";

export const BIO_PLACEHOLDER =
  "Placeholder: a short line about Ciara, their training and how they teach.";

export function written(value: string, placeholder: string): string {
  const waiting = value.trim() === "" || /coming soon\.?$/i.test(value.trim());
  if (!waiting) return value;
  return PLACEHOLDERS ? placeholder : "";
}
