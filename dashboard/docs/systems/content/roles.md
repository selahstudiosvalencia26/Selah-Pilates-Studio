# content: roles

Written 2026-11-13. Shared rules are in `../../dashboard/roles-and-permissions.md`.

| Permission | Plain words | Owner | Manager | Staff |
|---|---|---|---|---|
| `content.view` | See the website content | yes | yes | yes |
| `content.edit` | Edit the website content | yes | yes | no |
| `content.approve` | Publish changes to the website | yes | yes | no |
| `content.manage` | Change how the website is organized | yes | no | no |

Levels on the Roles screen: None, See, Change (edit drafts), Approve (publish), Everything.

## What each permission opens

- **view:** the pages, menu, gallery and announcement screens, and the "Unpublished changes" card on Today.
- **edit:** change words, prices, the menu and photos as drafts. Nothing goes live yet.
- **approve:** publish a draft to the website. Asks for confirmation.
- **manage:** add or remove pages and sections, and the page structure.

## Permissions follow the data

- Drafts are staff-only. The public website receives published content only.
- Opening hours come from the business profile, so changing them needs the shell's settings permission, not a second copy here.

## Tests

Staff can see but not edit. A manager can edit and publish. Unpublished drafts never appear in the public answers.
