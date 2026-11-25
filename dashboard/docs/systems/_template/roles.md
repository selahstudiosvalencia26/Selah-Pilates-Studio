# <system>: roles

Written <date>. Shared rules are in `../../dashboard/roles-and-permissions.md`.

| Permission | Plain words | Owner | Manager | Staff |
|---|---|---|---|---|
| `<id>.view` | See ... (required) | yes | yes | yes |
| `<id>.edit` | Add and change ... | yes | yes | yes |
| `<id>.approve` | ... (only if it exists) | yes | yes | no |
| `<id>.delete` | Delete ... (only if it exists) | yes | no | no |
| `<id>.manage` | Change <system> settings (only if it exists) | yes | no | no |

Write each plain-words label as a sentence. The Roles screen shows it, and builds its None / See / Change / Approve / Everything choice from what you declare.

## What each permission opens

One line for each: which screens, Today cards, search results and emails it covers.

## Permissions follow the data

List any data from another system that this system shows, and which permission of that system hides it. Say what happens when the person lacks it.

## Tests

One line for each rule that must keep working.
