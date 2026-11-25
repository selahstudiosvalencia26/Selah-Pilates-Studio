// Words on the home page. The words the owner can change live in content/data/home.json (the dashboard edits that file for
// now, and the database later). Words that are part of the design stay here.
import { classes } from "./classes";
import data from "./data/home.json";
import { hours } from "./hours";
import { site } from "./site";

// The length most classes share (the number shown as "Minutes in every class").
function commonMinutes(): number | string {
  const counts = new Map<number, number>();
  for (const c of classes)
    if (c.durationMinutes)
      counts.set(c.durationMinutes, (counts.get(c.durationMinutes) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "-";
}

export const home = {
  hero: {
    // The slogan is kept once, in the business details (content/data/site.json), and read here.
    title: site.tagline ?? "Strength in the pause.",
    text: data.hero.text,
    cta: data.hero.cta,
    // General pilates ideas, draft copy for Ciara to review.
    pointsTitle: data.hero.pointsTitle,
    points: data.hero.points,
  },
  // Photos arrive from the client. Set src to a path in public/images when they do.
  heroImage: {
    src: null as string | null,
    alt: "",
    hint: "A wide, calm photo of the studio in soft light, with the mats or reformers set up.",
  },
  // Draft copy about pilates in general, not claims about the studio. Ciara to review and replace with the studio story.
  about: {
    kicker: "About",
    title: data.about.title,
    text: data.about.text,
    photoAlt: "",
    storyNote: data.about.storyNote,
    // Real numbers from the studio, for example years teaching or classes each week. Never guess them.
    // Each item: { value: "8+", label: "Years teaching pilates" }. Empty until Ciara gives them.
    // Worked out from the class list and the opening hours, so they are always true (no numbers typed by hand).
    stats: [
      {
        value: String(
          classes.filter((c) => c.group === "Group mat class").length,
        ),
        label: "Group mat classes",
      },
      {
        value: String(
          classes.filter((c) => c.group === "Private reformer session").length,
        ),
        label: "Private reformer sessions",
      },
      {
        value: String(commonMinutes()),
        label: "Minutes in every class",
      },
      {
        value: String(hours.filter((d) => !d.closed).length),
        label: "Days open each week",
      },
    ] as { value: string; label: string }[],
    statsEmptyLabel: "Number to come",
  },
  benefits: {
    kicker: "Why pilates",
    title: data.benefits.title,
    text: data.benefits.text,
    photoAlt: "",
    photoHint:
      "Someone holding a calm stretch or pose in class, focused and relaxed.",
    // The pictures are part of the design, so they stay here and are matched to the items by position.
    items: data.benefits.items.map((item, i) => ({
      icon: ["barbell", "posture", "flexibility", "calm"][i] ?? "calm",
      ...item,
    })),
  },
  classes: {
    title: data.classes.title,
    text: data.classes.text,
    intro: data.classes.intro,
    emptyNote:
      "Our class list is coming soon. Send a message and we will tell you what is on.",
    cta: data.classes.cta,
  },
  visit: {
    title: "Visit the studio",
    hoursTitle: "Opening hours",
    hoursEmptyNote: "Opening hours are coming soon.",
    cta: "Book a session",
  },
  // Draft copy about pilates in general. Ciara to review.
  goodFor: {
    kicker: "Good for",
    title: "Made for many kinds of people",
    text: "Pilates can be changed to fit your body and your day.",
    items: [
      {
        title: "Busy people",
        text: "A short, slow class can reset a long day.",
      },
      { title: "Beginners", text: "Start gently and go at your own pace." },
      { title: "Stiff bodies", text: "Loosen tight shoulders, hips and back." },
      {
        title: "Desk workers",
        text: "Undo hours of sitting with better posture.",
      },
      { title: "Tired minds", text: "Slow breathing helps you feel calmer." },
      {
        title: "Active people",
        text: "Build the core strength other sports need.",
      },
    ],
  },
  // The words above the newer sections, all edited in the dashboard (Website, Home).
  week: data.week,
  first: data.first,
  reviewsTitle: data.reviews.title,
  blogTitle: data.blog.title,
  secondCta: data.hero.secondCta,
  faq: {
    kicker: "Questions",
    title: data.faq.title,
    items: data.faq.items,
  },
  banner: {
    kicker: "Join us",
    title: "Start your pilates journey",
    text: "Have a question or ready to begin? Send us a message.",
    cta: "Get in touch",
  },
  instructors: {
    kicker: "Instructors",
    watermark: "Our team",
    title: data.team.title,
    text: data.team.text,
    emptyNote: "Instructor names and photos are coming soon.",
  },
  location: {
    kicker: "Find us",
    title: "Visit the studio",
    addressTitle: "Address",
    hoursTitle: "Opening hours",
    hoursEmptyNote: "Opening hours are coming soon.",
    mapsCta: "Open in Google Maps",
    mapTitle: "Map showing Selah Pilates Studio",
  },
};
