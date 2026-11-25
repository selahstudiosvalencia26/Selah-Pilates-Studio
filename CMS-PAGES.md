# Page-by-page analysis (basis for the content editor)

Date: 2026-11-21. Every page of the Selah Pilates Studio site, top to bottom, with what each section shows, where that
content comes from today, and what the owner (Ciara) should be able to change. This is steps 1 and 2 of "Building it for
a client" in the dashboard's `docs/systems/content/flow.md`. The editor will follow this order.

Key: **Shared** = comes from a content file in `content/`, edit once and it shows everywhere. **Typed** = written into a
component today, needs a field before it can be edited. **Design** = layout or wording that is part of the design; stays
with the builder. **Draft** = general pilates copy written by the builder, not a claim from the studio; Ciara should read
it and keep, change or delete it. **Missing** = we do not have the fact yet; the site shows a "coming soon" note.

Dashboard: `C:\Users\ROG STRIX\Desktop\Dev\Selah Pilates Dashboard` (the `content` system is installed). Editor screens built
so far (2026-11-21), one tab for each page like the Dan Cafe dashboard: **Home, About, Class, Contact** (the words of each part of
the page, in page order), then **Site information** and **Opening hours** (the shared facts). They save to `content/local/*.json`
here, which the site reads only in `npm run dev`; the committed starting point is `content/data/*.json` (`site.json`,
`hours.json`, `home.json`, `about.json`, `class.json`, `contact.json`). Words that are part of the design stay in `content/*.ts`.
Each of Home, About and Class also has a **Photos** section: one row for every photo frame on the page (add, replace, remove, and a
required description). Picture files are saved in `public/uploads/photos` and listed in `photos.json`; the website's `PhotoSlot`
(`slot="..."`) and `content/classes.ts` / `instructors.ts` read them, and an empty frame keeps saying what photo to add.
Replaced pictures are not deleted (the live site may still use the old file): tidy `public/uploads` by hand when you publish.
Not built yet: the Classes editor (the 7 classes, prices, lengths, order) and a Team editor (more people, roles, bios).

## Sitewide (every page)

| Part | What it shows | Source | Editable? |
| --- | --- | --- | --- |
| Navigation bar | Studio name, links Home / About / Class / Contact, button "Book a session" | Links: Shared (`content/pages.ts`). Button word: **Typed** in `Navigation.tsx` | Link names no; button word yes |
| Phone menu | "Menu" / "Close" and the same links | **Typed** | No (Design) |
| Sticky bar on phones | "Book a session", and "Call us" once a phone number exists | Button word Shared (`home.visit.cta`); "Call us" **Typed** | Yes, follows the phone number |
| Footer | Slogan, "Book a session", Menu links, Classes list, Connect (Facebook, Instagram, Book online), copyright, "Back to top" | Slogan, class names, social links, booking link: Shared. Headings: **Typed** | Yes, all follow shared facts |
| Page titles and descriptions (Google) | One title and description per page | Shared (`content/pages.ts`) | Owner can read, builder edits |
| Business data for Google | Name, slogan, address, map pin, opening hours, social links, logo | Shared (built from the same facts) | Follows shared facts |
| Browser tab icon | The logo mark | Design (`app/icon.png`) | Builder |
| Photo frames (all pages) | "Photo to add" plus a note saying what photo to put there | Shared (notes in `content/`) | Replaced by real photos |

## 1. Home (`/`)

| # | Section | Content | Source | Editable? |
| --- | --- | --- | --- | --- |
| 1 | **Hero** | Slogan "Strength in the pause."; line "Mat and reformer pilates in Valencia City, Bukidnon."; button "Book your session"; small list "We do not move to tire the body." with 3 lines (Draft); big photo | Slogan **duplicated** (also `site.tagline`); line, button, list: Shared in `content/home.ts` (list is Draft); photo: **Missing** | Slogan, line, button, list, photo |
| 2 | **About** | Label "About"; one sentence (studio line, then the classes line); "The studio story is coming soon."; four numbers: 5 group mat classes, 2 private reformer sessions, 55 minutes, 6 days a week | Sentence: Shared but **duplicated** (also `site.description` and the About page). Numbers: **typed by hand** in `home.about.stats` | Sentence yes. Numbers should be **computed** from the class list and the hours, not retyped |
| 3 | **Classes** | Heading "Find a class that fits you."; line; swipeable row of all 7 classes (name, price, length, note, "Book" link, photo); button "Ask about classes" | Classes: Shared (`content/classes.ts`). Heading and button: Shared | Yes: add, remove, reorder, edit each class and its photo |
| 4 | **Why pilates** | Heading, line, one photo, 4 benefits (icon, title, line) | Shared (`home.benefits`), **Draft** | Yes (4 fixed items; icon chosen from a short list) |
| 5 | **Team** | Heading "Meet the team"; card stack with Ciara Bergado (photo, name, role, bio) | Shared (`content/instructors.ts`): name known, role, bio, photo **Missing** | Yes: add, remove, reorder people, photo, role, bio |
| 6 | **Quick answers** | 6 questions with answers | Shared (`home.faq`). 4 are **Draft**. Two contain **typed prices** that repeat the class list | Yes: add, remove, reorder. Prices should read from the class list |
| 7 | **Visit the studio** | Address, opening hours, "Book a session", "Open in Google Maps", still map with pin | Address, hours, map pin, booking link: Shared | Yes, through Site information and Opening hours |

Not on the page any more but still in `content/home.ts`: "Made for many kinds of people" (6 items), and the closing banner "Start your pilates journey". Delete them or keep for later.

## 2. About (`/about`)

| # | Section | Content | Source | Editable? |
| --- | --- | --- | --- | --- |
| 1 | Page header | "A calm place to move"; the studio line from the booking portal | Shared (`content/inner.ts`), **duplicated** with Home | Yes |
| 2 | Photos | One big and two small photo frames with notes (whole studio, close-up of mats, the entrance) | **Missing** | Yes: 3 photos with descriptions |
| 3 | **The method** | "Six ideas behind pilates": 6 numbered items | Shared, **Draft** (the well-known six principles) | Yes |
| 4 | **The name** | One sentence on what "Selah" means and the slogan; "The full studio story is coming soon." | Shared, **Draft**: the meaning must be confirmed by Ciara | Yes |
| 5 | **The team** | Photo frame, name "Ciara Bergado", "Her story is coming soon.", "Book a session" | Name Shared (`instructors.ts`); note Shared; role, story, photo **Missing** | Yes |
| 6 | Link card | "See what is on" with an arrow to the Class page | Shared | Yes (words) |

## 3. Class (`/class`)

| # | Section | Content | Source | Editable? |
| --- | --- | --- | --- | --- |
| 1 | Page header | "Find a class that fits you"; line; button "See the schedule and book" (opens the booking page) | Shared (`inner.ts`); button word **Typed** in `app/class/page.tsx` | Yes |
| 2 | **Group mat classes** | Heading, line "Every class is 55 minutes.", a photo, 5 rows: Sculpt, Align, Unfold, Essentials, Ease (name, note, length, price, whole row is a booking link) | Classes Shared. Line **Typed** ("55 minutes" repeats the data). Photo **Missing** | Yes |
| 3 | **Private reformer sessions** | Heading, line, a photo, 2 rows: Solo Class ₱900, Duet Class ₱1,600 | Shared. Photo **Missing** | Yes |
| 4 | **Find your class** | Three picks: Essentials (beginners), Sculpt (strength), Ease (seniors) | Shared (`inner.class.levels`), wording from the portal | Yes (but it should point at a class, not repeat the words) |
| 5 | **Before your first class** | 4 friendly tips | Shared, **Draft** | Yes |
| 6 | Closing panel | "Not sure where to start?", line, "Book a session" | Shared | Yes |

## 4. Contact (`/contact`)

| # | Section | Content | Source | Editable? |
| --- | --- | --- | --- | --- |
| 1 | Page header | "Get in touch"; line | Shared | Yes |
| 2 | **Other ways to reach us** | Rows: Book online, Facebook, Instagram (`@selah.vlc`); Phone and Email rows appear once they exist; note "Phone and email are coming soon." | Links and numbers: Shared (`site.ts`). Row words: Shared. Phone, email: **Missing** | Yes |
| 3 | **Send us a message** (form) | Heading, line, fields (name, phone, class, days and times, message), "Send message", status messages | Heading and line Shared. Field labels and messages **Typed** in `ContactForm.tsx`. Class list Shared | Heading and line yes. Labels: builder. Where it goes: Messenger today, the dashboard's booking connection later (`NEXT_PUBLIC_BOOKING_URL`) |
| 4 | **Come and visit** | Label, heading, wide map, address, opening hours, "Open in Google Maps" | Shared | Yes, through Site information and Opening hours |

## Facts shown in more than one place (fix before the editor is built)

The rule is: edit once, show everywhere. These break it today.

| Fact | Where it is repeated | Fix |
| --- | --- | --- |
| Slogan "Strength in the pause." | `site.tagline` and `home.hero.title` | Hero reads the tagline |
| Studio description | `site.description`, `home.about.text`, `inner.about.text` | One field, used in all three |
| Class prices | `classes.ts`, and typed in a FAQ answer | The answer reads the prices |
| "5 / 2 / 55 / 6" numbers | Typed in `home.about.stats`, but they come from the class list and hours | Computed |
| "Every class is 55 minutes" | Typed in 2 places | Computed from the classes, or one field |
| "Book a session" button word | Navigation, home, footer, mobile bar, inner pages | One field |

## Words typed into components (builder only unless the owner asks)

Navigation button, footer headings ("Menu", "Classes", "Connect"), "Back to top", "Call us", the "See the schedule and
book" button, all contact-form labels and messages, the "Photo to add" label, "Book" on class cards. These are part of
the design. If the owner ever needs one changed, it moves into `content/` first.

## What the owner edits (suggested editor screens)

By kind of content, not by page, because one fact shows in many places.

| Screen | Holds | Pages it changes |
| --- | --- | --- |
| Site information | Name, slogan, description, address, map pin, phone, email, Facebook, Instagram, booking link | All |
| Opening hours | Days and times (shared with the dashboard's business profile) | Home, Contact, Google |
| Classes | The 7 classes: name, group, note, level, length, price, photo, order | Home, Class, Footer, Contact form |
| Team | People: name, role, bio, photo | Home, About |
| Photos | The photo slots and any extra photos, with a description for each | Every page |
| Page text | Hero lines, About text, "Why pilates", method, name, tips, quick answers, closing panels | Home, About, Class, Contact |

The dashboard's `content` system ships with Pages, Menu, Gallery and Announcement. For Selah: "Menu" becomes **Classes**
(the words setting), "Gallery" is **Photos**, "Announcement" is optional (there is none on the site now, so leave it off),
and **Team** is new.

## Questions for Ciara

1. Which things will you change yourself: class prices, the schedule, photos, your story?
2. Is the meaning of "Selah" on the About page right?
3. Do you want the "Why pilates" and "Questions" text, or only what is about your own studio?
4. Your role (owner, instructor, both?), a short story, and a photo you are happy to share.
5. Do you want a phone number and email on the site? (a phone number turns on "Call us" on phones)
6. Who may publish changes: only you, or others too?
