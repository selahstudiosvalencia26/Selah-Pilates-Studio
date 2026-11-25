# System architecture

Written 2026-11-12. The big picture: what the parts are, where they run, how they talk, and why. For the inside of each part see `system-design.md`. For the requirements see `../product/prd.md`.

## 1. The picture

Everything below exists once for each client, in the client's own accounts.

```
                    Visitors / customers
                            |
                            v
              +---------------------------+
              |  Website (apps/web)       |   Vercel project 1
              |  public pages, booking    |
              |  form, content            |
              +-------------+-------------+
                            |  small locked public connection
                            v
 Staff, manager, owner  +---------------------------+        GitHub (client's repo)
 (phone or desktop) --> |  Dashboard (apps/dashboard)|  <---  main branch, update proposals,
                        |  Next.js on Vercel         |        scheduled workflow ("alarm clock")
                        |  project 2                 |
                        +---+-----------+-----------+
                            |           |
          +-----------------+           +------------------+
          v                                                v
 +---------------------+  +-------------------+   +-------------------+
 | Supabase            |  | Resend            |   | Google Drive      |
 | database, sign-in,  |  | email from the    |   | weekly backups    |
 | file storage        |  | client's domain   |   | (one folder)      |
 +---------------------+  +-------------------+   +-------------------+

 You (the builder): invited as a team member to each account. Never share a password.
```

If the client has no website with us, the dashboard stands alone. If they have one, the repo is a monorepo (see `../product/modular-dashboard.md`).

## 2. The parts

| Part | What it is | Where it runs | Who owns it |
|---|---|---|---|
| Dashboard app | The shell and the systems (Next.js, App Router) | Vercel project | Client |
| Website app | The public website (optional) | Separate Vercel project | Client |
| Database | Postgres with row-level security | Supabase | Client |
| Sign-in | Email code and sessions | Supabase Auth | Client |
| File storage | Private files, a small public bucket for the logo | Supabase Storage | Client |
| Email | Sign-in codes, invites, system emails | Resend, client's domain | Client |
| Backups | Weekly database export and new files | Google Drive folder | Client |
| Scheduled jobs | Backups, health checks, cleanup | GitHub scheduled workflow calling a secret address | Client's repo |
| Source code | The dashboard and its systems | GitHub repo | Client |
| Master copy | The reusable shell and systems | Your own repo | You |

## 3. Layers inside the dashboard app

```
 Pages (src/app)            what people see, one folder for each route
        |
 Shell (src/shell)          sign in, people, roles, menu, Today, settings, ...
 Systems (src/systems)      booking, content, payments, ... (one folder each; none on main, each on its system/<word> branch)
 Extensions (src/extensions)this client's own changes
        |
 Kit (src/kit)              the shared toolbox every part uses:
                            permissions, database, screen parts, files, email, words, errors
        |
 Database layer (src/lib)   the one place that talks to Supabase
```

**Rules for the layers**
1. Pages call the shell or a system. They never talk to the database directly.
2. The shell and systems use the kit. They never reach into each other's insides.
3. A system never reads another system's tables. It asks through a small named function the other system offers, and it still works if the other is off.
4. Only the database layer knows Supabase. A move to another database changes one folder.
5. Extensions may add to the dashboard, but updates never overwrite them.

## 4. How a request travels

```
Browser
  -> Vercel edge: HTTPS only, security headers, bot and rate limits
  -> Middleware: is there a valid session? (no, then go to sign in)
  -> Server action or route handler:
        1. check the input against a strict format
        2. ask the kit: may this person do this? (role and permission, on the server)
        3. do the work through the database layer
        4. write to the activity log if it matters
  -> Supabase: row-level security checks again
  <- a short, plain answer (details go to the log, never the screen)
```

Two independent checks (the server and the database) means a bug in one does not open a door.

## 5. The public connection (website to dashboard)

The website never gets the database's secret key and never talks to the database. Each system that has a public page offers a small connection:

- Its own address (for example `/api/public/booking/...`).
- Only named fields are accepted. Everything else is refused.
- Its own rate limits and spam check.
- No staff sign-in cookies. The staff session is never shared with the website.
- It returns only what a stranger may see (for example free and busy dates, never other customers' details).

## 6. Environments

| Environment | Purpose | Data |
|---|---|---|
| Local | Building on your computer | Your own development Supabase project, sample data |
| Practice copy | Try every update before a client sees it | Sample data only. Not open to the public. |
| Production | The client's real dashboard | Real data |

Preview copies made for each change are not public and hold no real data.

## 7. One copy for each client

- Separate repo, separate Vercel project, separate Supabase project, separate keys.
- A mistake or break-in in one client cannot reach another.
- Updates reach each client by an update proposal that you approve client by client.
- Cost: more to look after. Fine for the first few clients. If it grows past about ten, look at a control page (every client, version, health) and a private shared package for the shell.

## 8. Scheduled jobs

A web app only runs when someone visits it. A free scheduled workflow in the client's GitHub repo calls a secret-protected address in the dashboard. Only the workflow knows the secret. The jobs: weekly backup, health checks every few hours, invite cleanup, trial end, email retries, the daily recycle-bin purge. Counts for rate limits are kept in a small database table, because a counter in memory is lost between requests on serverless hosting.

## 9. Security in the architecture

Short version (full plan in `../rules/security.md`):
- Layers: network, headers and cookies, sign-in, roles, input, secrets, packages, the accounts around it, data, watching.
- Closed by default. The browser is never trusted. Least power everywhere.
- The master database key lives only on the server, in the host's secret settings.
- The dashboard never runs SQL itself in version 1, so it needs no master database key beyond normal server use. You copy the SQL into the Supabase editor.

## 10. Technology choices

| Choice | Why |
|---|---|
| Next.js (App Router), React | You already use them. Server actions keep checks on the server. |
| Tailwind | Fast, consistent, easy to theme with the client's accent. |
| Supabase | Postgres with row-level security, auth, storage and backups in one place. Client-owned. |
| Resend | Simple email from the client's own domain. You already use it. |
| Vercel | Easy deploys from GitHub, previews for each change. |
| Google Drive | Free for the client, independent of the dashboard, familiar. |
| GitHub Actions | Free scheduled jobs and the automatic install check. |

Keep the database code in one place so a move to a cheaper database stays possible.

## 11. Decisions that shape the architecture

| Decision | Where |
|---|---|
| One copy for each client, in the client's accounts, with a license | `../product/modular-dashboard.md` |
| Systems added through GitHub, not uploaded into the running dashboard | `../product/modular-dashboard.md` |
| You copy the SQL by hand in version 1 | `../dashboard/shell-plan.md` |
| Public pages live on the client's website, through a locked connection | `../dashboard/shell-plan.md` |
| Scheduled jobs by GitHub workflow, rate limits in a database table | `../dashboard/shell-plan.md` |
| No automatic email to you; the owner sees the status chip | `../dashboard/shell-plan.md` |
| Updates are proposed to each copy and approved by you, client by client | `../dashboard/shell-plan.md` |
| Backups to the client's Google Drive, 4 weekly and 3 monthly | `../dashboard/shell-plan.md` |
