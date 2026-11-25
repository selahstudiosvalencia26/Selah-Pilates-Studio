# API plan

Written 2026-11-13. The dashboard has no public developer API in version 1. It has four kinds of "door", each with its own rules. This file lists them and the rules they share. Each system lists its own doors in `systems/<id>/api.md`. Design detail is in `system-design.md` (sections 5, 7 and 11) and `system-architecture.md` (sections 4, 5 and 8).

## The four doors

| Door | Who calls it | Where it lives | Signed in? |
|---|---|---|---|
| **Staff actions** | The dashboard's own screens | Server actions in the system's folder | Yes, always |
| **Public connection** | The client's website, by a stranger | `/api/public/<system>/...` | No. Never the staff session. |
| **Scheduled jobs** | The GitHub workflow | `/api/jobs/<name>` | A long secret, not a person |
| **System to system** | One system asking another | A named function the other system provides | Same request, same person |

## Staff actions

- A server action does one thing: check, then act. Order: signed in, has the permission, the thing belongs to this business, the input is valid, then write.
- Input is checked with zod strict objects. Unknown fields are refused.
- **One answer shape** (`src/kit/result.ts`): `{ ok: true, data }` or `{ ok: false, message }`. The message is plain words and safe to show.
- Safe to repeat: saving twice does not create two records. Status changes check the current status first.
- Every change is written to the activity log. Delete means the recycle bin (30 days), except money, which is voided, never deleted.
- Lists are paged. Nothing returns an unlimited list.

## Public connection

The website never gets the database key and never talks to the database.

- One address for each purpose, for example `POST /api/public/booking/request`.
- Only named fields are accepted. Everything else is refused.
- Order: spam check (hidden field), rate limit by address and caller, strict format check, then write. The write only creates a record in its first status (`requested`); it never confirms.
- Rate-limit counts are kept in a small database table, because memory is lost between requests on serverless hosting.
- It returns only what a stranger may see: busy times, never names. A short thank-you, never private data.
- Staff cookies are never read here and never sent here.
- Allowed origins: the client's own website only.
- Errors: a short plain message and a status code (`400` bad input, `429` too many, `500` try again). Never a stack trace.

## Scheduled jobs

Each job is a secret-protected address called by a free GitHub workflow. Only the workflow knows the secret.

| Address | When | Does |
|---|---|---|
| `/api/jobs/backup` | Weekly | Export to Google Drive, keep 4 weekly and 3 monthly |
| `/api/jobs/health` | Every few hours | Run the status checks |
| `/api/jobs/purge` | Daily | Remove recycle-bin items older than 30 days |
| `/api/jobs/invites` | Daily | Expire old invites |
| `/api/jobs/email-retry` | Every few minutes | Retry failed emails twice |
| `/api/jobs/trial` | Daily | Make a trial copy read-only on its end date |

A job refuses any call without the secret, does one small piece of work, and is safe to run twice.

## System to system

- A system offers a few named functions in its description file (`provides`), for example `getDepositStatus(subject)`.
- Another system may call them only if it lists that system under `needs` or `optional`.
- The call runs for the same person, so permissions follow the data: if the person may not see payments, `booking` gets nothing back and leaves that part out.
- A system never reads another system's tables.

## Rules for all doors

1. Validate every input on the server. The screen's checks are only a courtesy.
2. Money is `numeric` with a currency. Time is stored in UTC and shown in Manila time.
3. No secrets in the browser, in logs or in errors.
4. Add a new door only by naming it in the system's description file. The install check lists them, and a test covers each.
5. Changing a door's fields later must stay backwards compatible, or it is a new version.

## Not in version 1

A public developer API, webhooks sent out to other tools, and API keys for clients. Add them only if a client asks.
