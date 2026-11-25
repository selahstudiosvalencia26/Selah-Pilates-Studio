// The places on the website that hold a photo. Each has a name (its id), which the website uses to find the photo saved for it. The
// ids match the `slot` names in the website's code (components/PhotoSlot.tsx and content/photos.ts). `hint` says what photo suits
// the place, the same words the empty frame on the website shows.
export type Slot = {
  id: string;
  label: string;
  where: string; // in plain words, so nobody replaces a photo without knowing where it shows
  hint: string;
  alt: string; // the description to start from. Screen readers and Google read it.
  frame: number; // the shape of the frame on the website, as width divided by height (used for the preview)
};

export const SLOTS: readonly Slot[] = [
  {
    id: "home-hero",
    label: "Top photo",
    where: "Home page, the big photo behind the slogan",
    hint: "A wide, calm photo of the studio in soft light, with the mats or reformers set up.",
    alt: "",
    frame: 16 / 9,
  },
  {
    id: "home-benefits",
    label: "Why pilates photo",
    where: "Home page, beside the four benefits",
    hint: "Someone holding a calm stretch or pose in class, focused and relaxed.",
    alt: "",
    frame: 4 / 5,
  },
  {
    id: "about-main",
    label: "Big studio photo",
    where: "About page, the large photo at the top",
    hint: "A wide shot of the whole studio, with the mats and reformers set up in natural light.",
    alt: "",
    frame: 4 / 3,
  },
  {
    id: "about-side-1",
    label: "Small photo, top",
    where: "About page, the first small photo",
    hint: "A close-up of the mats or the reformer.",
    alt: "",
    frame: 4 / 3,
  },
  {
    id: "about-side-2",
    label: "Small photo, bottom",
    where: "About page, the second small photo",
    hint: "The entrance or front of the studio, so people know what to look for.",
    alt: "",
    frame: 4 / 3,
  },
  {
    id: "team-ciara-bergado",
    label: "Ciara Bergado",
    where: "About page and the Home team cards",
    hint: "A friendly portrait of Ciara in the studio, in good light (ask her first).",
    alt: "Ciara Bergado",
    frame: 4 / 5,
  },
  {
    id: "class-group-mat",
    label: "Group mat classes photo",
    where: "Class page, beside the group mat classes",
    hint: "People on their mats in a group class.",
    alt: "",
    frame: 4 / 3,
  },
  {
    id: "class-group-private",
    label: "Private sessions photo",
    where: "Class page, beside the private reformer sessions",
    hint: "A Solo or Duet session on the reformer.",
    alt: "",
    frame: 4 / 3,
  },
];

export const slotById = (id: string) => SLOTS.find((s) => s.id === id);

// The photo place of one class (its card on the Home class row). It exists as long as the class does, so it is made from the class.
export const CLASS_SLOT_PREFIX = "class-";
export const classSlot = (c: {
  slug: string;
  name: string;
  group: string;
}): Slot => ({
  id: `${CLASS_SLOT_PREFIX}${c.slug}`,
  label: `${c.name} photo`,
  where: `Home page, the ${c.name} card in the class row`,
  hint:
    c.group === "Private reformer session"
      ? `A ${c.name} session on the reformer.`
      : `People on their mats in the ${c.name} class.`,
  alt: c.name,
  frame: 4 / 3,
});
