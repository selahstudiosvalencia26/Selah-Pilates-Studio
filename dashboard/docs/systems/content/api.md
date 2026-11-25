# content: API

Written 2026-11-13. The doors this system opens. Shared rules are in `../../architecture/api.md`. Names are the plan.

## Public connection (the client's website reads it)

| Address | Returns |
|---|---|
| `GET /api/public/content/site` | Site information: business name, contact, social links, announcement, opening hours. Published only. |
| `GET /api/public/content/[slug]` | One published page as its blocks (text, images, menu sections). |

Read-only. No body is accepted, there is no sign-in, and drafts never appear. Answers can be cached for a short time and are dropped when something is published. Rate-limited like every public address. An unknown slug returns `404`.

## Staff actions (signed in)

| Action | Needs | Does |
|---|---|---|
| `saveDraft` | `content.edit` | Save changes to a page or block as a draft |
| `publish` | `content.approve` | Make the draft live. Records who and when. |
| `discardDraft` | `content.edit` | Go back to the published version |
| `uploadImage` | `content.edit` | Shrink on the phone, store, add a short description for screen readers |
| `saveStructure` | `content.manage` | Add, remove and reorder pages and sections |

Blocks are checked against a strict shape for their kind. Unknown fields are refused. Publishing the same draft twice changes nothing.

## Offered to other systems

`getPublishedPage(slug)`, `getSiteInfo()`. Published content is not private, so these need no extra permission.

## Used from other systems

None. Opening hours are read from the shell's business profile.

## Emails and jobs

None.
