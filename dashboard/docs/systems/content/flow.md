# content: flows

Written 2026-11-12. See `prd.md` and `design.md`. General flows are in `../../dashboard/app-flow.md`.

## 1. Change the menu

```
Editor: Website -> Menu
  -> pick a section -> edit an item (name, description, price, photo, available or not)
  -> Save draft (the website does not change yet)
  -> Publish (someone with approve permission)
The dashboard tells the website to refresh. Visitors see the new menu within moments.
Logged: who published, and when.
```

## 2. Change the announcement

```
Website -> Announcement -> edit the text -> switch On or Off -> Publish
Off removes the banner from the site.
```

## 3. Change the gallery

```
Website -> Gallery -> Add photos
  each photo is checked, shrunk and uploaded privately; alt text is required
  drag or use arrows to reorder; remove one (goes to the recycle bin for 30 days)
  Publish
```

## 4. Edit a page's text (about, events, home)

```
Website -> pick a page -> edit blocks in place -> reorder -> Save draft -> Publish
```

## 5. Change the opening hours

```
Settings -> Business profile -> opening hours (the same hours the booking system uses)
The website's "Open now" and contact details read the same value, so they always agree.
```

## 6. What visitors do

```
Visitor opens the website
  -> the website serves published content (cached)
  -> if the dashboard is unreachable, the last good copy is shown
  -> a visitor never sees a draft
```

## 7. Setting up (once)

```
Install check passes -> copy 001_create_tables.sql into Supabase -> done
One-time import of the website's current content files into pages and blocks
Check each page against the live site before switching the website to read from the dashboard
```

## 8. Building it for a client (read first, then build)

This system is shaped by the client's real website, so it is built in this order. Dan Cafe is the example.

```
1 Read the website -> 2 Decide what the owner changes -> 3 Build the editor screens -> 4 Load today's content -> 5 Switch the website over
```

1. **Read the website.** Go through every page and section, and every content file (for Dan Cafe: `site.ts`, `hours.ts`, `menu.ts`, `gallery.ts`, `reviews.ts`, `announcement.ts`). Write one line for each thing shown: what it is, where it comes from, and where it appears. Example: "Opening hours, from `hours.ts`, shown in the footer, the info strip, the Open now badge and the closing call to action." Also note any words typed straight into a page (for example the About story), because those are not in the content files.
2. **Decide what the owner changes.** Mark each line "owner edits" or "builder only" with the owner. Layout, design and animation stay builder only. Opening hours go first, because the Open now badge depends on them.
3. **Build the editor.** One screen for each kind of content (site information, hours, menu, photos, reviews, announcement, page text), with only the fields the website really uses, in plain words. It is organised by kind of content, not by page, because one fact shows in many places and is edited once.
4. **Load today's content.** A one-time import fills the database from the current files, so the owner's first look is their own real menu and hours, with nothing to retype.
5. **Switch the website over.** Pages read the published content from the database and refresh when the owner publishes. The old content files stay as the fallback, so the website never goes blank.

Rule: nothing is invented. If a fact is missing, the website keeps showing `[needs from client]` until the owner supplies it.

## Edge cases

| Case | What happens |
|---|---|
| Someone pastes text with a script | The script is removed on save. |
| A photo is not an image or is too big | Refused with a plain message. |
| Two people edit the same page | The second save warns "Someone changed this. Reload to see their changes." |
| Publish while the website is down | The change is saved and shows on the next refresh. |
| Leaving a page with unsaved edits | Asks first. |
