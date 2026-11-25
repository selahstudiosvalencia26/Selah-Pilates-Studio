import { savedPhoto } from "./photos";
import about from "./data/about.json";
import { BIO_PLACEHOLDER, written } from "./placeholders";

export type Instructor = {
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
  /** CSS object-position of the photo, so the crop keeps the part the owner chose. */
  imagePosition?: string | null;
};

// From the studio booking portal (Staff). Role, short bio and photo are not given yet.
export const instructors: Instructor[] = [
  {
    slug: "ciara-bergado",
    name: "Ciara Bergado",
    role: null,
    bio: written(about.team.note, BIO_PLACEHOLDER) || null,
    // Read when asked, not when the file loads, so a photo added in the dashboard shows after a reload.
    get image() {
      return savedPhoto("team-ciara-bergado")?.src ?? null;
    },
    get imagePosition() {
      return savedPhoto("team-ciara-bergado")?.position ?? null;
    },
  },
];
