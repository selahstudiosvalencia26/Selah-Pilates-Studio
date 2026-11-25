# content: design

Written 2026-11-12. See `prd.md`. Shared design is in `../../architecture/system-design.md`, tables in `../../architecture/data-model.md`.

## Idea

The website reads its words and photos from the dashboard's `content` system instead of code files. Content is organized as **pages** that hold ordered **blocks**. A block is a small typed piece: text, image, list, or a menu section. The website asks a small public connection for published content, caches it, and keeps showing the last good copy if the dashboard is unreachable.

## Description file (key parts)

- `id`: `content`. `needs`: `files` (photos). `optional`: none.
- Permissions: `content.view` (Owner, Manager, Staff), `content.edit` (Owner, Manager), `content.approve` (publish; Owner, Manager), `content.manage` (structure; Owner).
- Pages: `/content` (list of pages and site information), `/content/[slug]` (edit), `/content/menu`, `/content/gallery`, `/content/announcement`.
- Today: **Unpublished changes** (a card when a draft has not been published).
- Emails: none.
- Public: `GET /api/public/content/[slug]`, `GET /api/public/content/site` (published only).
- Search: page titles and block text.
- Provides: `getPublishedPage`, `getSiteInfo`.

## Tables

`content_pages`, `content_blocks`, `content_media` (columns in `../../architecture/data-model.md`). Blocks hold their value as validated JSON for their kind. The menu is a page whose blocks are sections with items. Hours come from the business profile (`business_hours`) rather than a second copy, so the website and the dashboard agree.

## Draft and publish

- Edits save to the draft copy. **Publish** copies the draft to the published copy in one step and records who and when.
- The public connection reads only the published copy. A visitor can never see a draft.
- Keeping one published copy plus one draft is enough for version 1.

## Safety

- Text is cleaned with an allow-list on save (no scripts, no raw HTML from editors). Only simple formatting is allowed.
- Photos: type checked by content, size limit, re-saved, renamed, stored privately; the website gets them through a signed, cached image address. Alt text is required.
- The public connection returns only published content, only named fields, with a rate limit. It never reads the staff session.

## Website side

- The website's server asks the public connection at build or request time, caches the result, and revalidates when a publish happens (a small secret-protected "refresh" call from the dashboard).
- If the dashboard cannot be reached, the website shows the last good copy. The site never breaks because the dashboard is down.
- Moving Dan Cafe from its code files: a one-time import turns `site.ts`, `menu.ts`, `hours.ts`, `announcement.ts` and `gallery.ts` into pages and blocks.

## Screens

| Screen | Shows |
|---|---|
| Content home | Pages, site information, what has unpublished changes. |
| Edit page | Blocks in order, edit in place, reorder, Save draft, Publish. |
| Menu | Sections and items, with availability switches. |
| Gallery | Photos, reorder by drag or arrows, alt text. |
| Announcement | Text and an on and off switch. |

## Tests

- Roles: staff cannot publish; editor can edit; viewer cannot edit.
- Cleaning: a script tag in text is removed; a non-image upload is refused.
- Draft and publish: a draft never reaches the public connection; publish does.
- Website fallback: with the dashboard unreachable, the last good copy is shown.
- Hours: changing the business profile's hours changes what the website shows.
