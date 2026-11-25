# content: requirements (PRD)

Written 2026-11-12. Lets the client edit their website's words and photos from the dashboard, for the Dan Cafe pilot. Design in `design.md`, steps in `flow.md`.

## Problem

Dan Cafe's website keeps its text, menu, hours, announcement and gallery in code files (`content/site.ts`, `menu.ts`, `hours.ts`, `announcement.ts`, `gallery.ts`). Every small change means asking the builder.

## Users

| Person | Need |
|---|---|
| Owner, manager, staff with permission | Change the menu, hours, announcement and photos in minutes, from a phone, without breaking the site. |
| Visitors | A site that is always correct and fast. |

## Goals (version 1)

1. Edit the website's text and photos in the dashboard.
2. Draft, then publish. The website shows only published content.
3. Pages and blocks that match what the website already has (home, about, menu, gallery, events, contact, announcement, hours, site information).
4. Safe: text is cleaned, photos are checked, nobody can inject a script.
5. Fast: the website stays fast and keeps working if the dashboard is down.

## Not in version 1

A page builder or layout editor, new page types, blog and comments, multiple languages, versions and rollback beyond the last published one, scheduled publishing.

## Requirements

| # | Requirement | Done when |
|---|---|---|
| C1 | Editable site information: name, address, phone, social links. | The footer and contact page update after publish. |
| C2 | Editable opening hours (shared with the business profile). | The website's "Open now" is correct. |
| C3 | Menu: sections and items (name, description, price, photo, available or not). | A price change shows on the site after publish. |
| C4 | Announcement banner: text, on and off. | Switching it off removes it. |
| C5 | Gallery: add, reorder, remove photos with alt text. | Photos show in the new order. |
| C6 | Page text blocks for about, events and home. | Edits show after publish. |
| C7 | Draft and Publish for every change. | Visitors never see a draft. |
| C8 | Text and photos are checked on save. | A script in text is removed; a non-image upload is refused. |
| C9 | Every publish is logged. | Visible in the activity log. |

## Quality

Phone first, accessible (alt text is required for photos), plain English. The website must not depend on the dashboard being up for each page view.

## Success

Dan Cafe changes the menu, hours and announcement themselves for a month with no builder help, and the site stays fast.

## Questions to ask Dan Cafe

1. Which parts do they change often (menu prices, specials, hours, events)?
2. Who edits, and who approves what goes live?
3. How many photos in the gallery, and how often do they change?
4. Should the Festival and countdown on the site be editable too?
