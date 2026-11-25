import about from "./data/about.json";
import classPage from "./data/class.json";
import contact from "./data/contact.json";
// Words for the About, Class and Contact pages. The words the owner can change live in content/data/about.json, class.json
// and contact.json (the dashboard edits those files for now, and the database later). Words that are part of the design stay here.
// Only facts we know are used here. Anything else says it is coming.
// Draft copy about pilates in general (not claims about the studio) is marked "draft".
export const inner = {
  about: {
    kicker: "About",
    title: about.header.title,
    text: about.header.text,
    photoNote: "Photos of the studio are coming soon.",
    photoHints: [
      "A wide shot of the whole studio, with the mats and reformers set up in natural light.",
      "A close-up of the mats or the reformer.",
      "The entrance or front of the studio, so people know what to look for.",
    ],
    offer: {
      kicker: "What we offer",
      title: "Two ways to practise",
      text: "Join others in a group mat class, or book a private session on the reformer.",
      groupTitle: "Group mat classes",
      groupText: "Every class is 55 minutes.",
      privateTitle: "Private reformer sessions",
      privateText: "Solo for one person, or Duet for two. Tailored to you.",
      cta: "See all classes",
    },
    team: {
      kicker: "The team",
      photoHint:
        "A friendly portrait of Ciara in the studio, in good light (ask her first).",
      note: about.team.note,
    },
    // draft: the six ideas pilates is built on (a well-known list).
    principles: {
      kicker: "The method",
      title: about.method.title,
      text: about.method.text,
      items: about.method.items,
    },
    // draft: to confirm with Ciara.
    name: {
      kicker: "The name",
      text: about.name.text,
      note: about.name.note,
    },
    next: { text: "See what is on", href: "/class" },
  },
  class: {
    kicker: "Class",
    title: classPage.header.title,
    text: classPage.header.text,
    emptyNote:
      "Our class list is coming soon. Send a message and we will tell you what is on.",
    // From the studio booking portal.
    explained: {
      kicker: "Two ways to move",
      title: "Mat or reformer",
      text: "Join a group class, or book a private session.",
      items: [
        {
          title: "Group mat classes",
          text: "Join a class on the mat, from Essentials for beginners to Sculpt for strength.",
        },
        {
          title: "Private reformer sessions",
          text: "Book a Solo or Duet session on the reformer, tailored to you.",
        },
        {
          title: "Not sure where to start?",
          text: "Try Essentials. It is best for beginners.",
        },
      ],
    },
    levels: {
      kicker: "Which one?",
      title: classPage.levels.title,
      items: classPage.levels.items,
    },
    // draft: friendly tips, not studio rules.
    firstClass: {
      kicker: "First time",
      title: classPage.firstClass.title,
      items: classPage.firstClass.items,
    },
    heroPhotoHint:
      "A wide photo of a group mat class in progress, with people on their mats.",
    groups: {
      "Group mat class": {
        title: "Group mat classes",
        text: "Join a class on the mat. Every class is 55 minutes.",
        photoHint: "People on their mats in a group class.",
      },
      "Private reformer session": {
        title: "Private reformer sessions",
        text: "Solo for one person, or Duet for two. Tailored to you.",
        photoHint: "A Solo or Duet session on the reformer.",
      },
    },
    ctaTitle: classPage.closing.title,
    ctaText: classPage.closing.text,
  },
  contact: {
    kicker: "Contact",
    title: contact.header.title,
    text: contact.header.text,
    channelsKicker: "Reach us",
    channelsTitle: "Other ways to reach us",
    form: {
      title: contact.form.title,
      text: contact.form.text,
    },
    bookTitle: "Book online",
    bookText: "Pick a time on our booking page.",
    facebookTitle: "Facebook",
    facebookText: "Send us a message.",
    instagramTitle: "Instagram",
    phoneTitle: "Phone",
    emailTitle: "Email",
    moreSoon: "Phone and email are coming soon.",
    find: {
      kicker: "Find us",
      title: contact.find.title,
      addressTitle: "Address",
      hoursTitle: "Opening hours",
      hoursEmptyNote: "Opening hours are coming soon.",
      directionsTitle: "Directions",
      googleMaps: "Open in Google Maps",
    },
  },
};
