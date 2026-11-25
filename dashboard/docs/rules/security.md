# Shell security plan

Written 2026-11-12. The shell is the front door of every client's business. It holds their customers, money and staff, so it is built as if attackers will try it every day.

No system is unhackable. The goal is to make attacks hard, limit the damage if one gets through, notice it quickly, and recover. Plain words where possible. Technical names are in brackets so you can search for them.

## Principles

1. **Layers.** If one defense fails, the next one catches it. No single lock protects everything.
2. **Closed by default.** A new table, page or action allows nobody until we say who may.
3. **The browser is never trusted.** Every check happens on the server again.
4. **Least power.** Every person, key and service gets only what it needs.
5. **Small.** Fewer features, fewer pages and fewer packages mean fewer ways in.
6. **Watch everything.** Important events are logged, and the bad ones alert you.
7. **Plan for the bad day.** Know in advance what to do when something goes wrong.

## 1. At the door (the network)

- Only HTTPS, with the browser told to always use it (HSTS). Every other page address stays closed.
- Use the host's firewall and bot protection on sign-in and public pages.
- Rate limits on everything open: sign-in codes, invites, the contact form, public booking pages.
- Public pages (a booking form, an order link) are built on the client's website and reach the dashboard only through a small locked connection, so an attack on them cannot reach staff data.
- Preview copies of the app (made for each change) must not be open to the public or hold real data.

## 2. What the browser is told (headers and cookies)

- A strict content policy (CSP), so only our own scripts can run. This blocks most "inject a script" attacks.
- The app cannot be shown inside another site's frame (clickjacking).
- No guessing of file types, a strict referrer policy, and unneeded browser powers switched off.
- Sign-in cookies are secure, hidden from scripts (HttpOnly), and same-site.
- The server does not announce what software it runs.

## 3. Signing in

- Codes are stored hashed, expire in 10 minutes, and allow 5 tries. Asking for a new code is rate-limited by email and by address.
- The reply is the same whether or not an email exists, so nobody can test which emails are customers (no user guessing).
- Owners get the second email code (see `../dashboard/shell-plan.md`), plus a new-device alert.
- **Passwords are optional** and checked as carefully as codes. Adding or changing one needs the current password again (or an emailed code if there is none yet), at least 12 characters, at most 72 bytes, no very common password, none that holds the person's email, and none that appears in a known breach. The breach check sends only the first 5 characters of the password's SHA-1 fingerprint to a fixed address (k-anonymity), never the password. If that service cannot be reached the change goes on, because blocking everyone for an outside outage would be worse.
- Wrong password tries are limited per person and per address, and a wrong email and a wrong password get the same answer.
- After a password change every other device is signed out (unless the person unticks it), an activity log line is written, and the person is emailed. None of them ever holds the password.
- Sessions are short and rotate. They end at once when someone is switched off, their role changes, or the owner signs everyone out.
- Each person can see their signed-in devices and end them.
- Failed sign-ins and new devices are logged and alert the owner when it looks like an attack.

## 4. Who may do what (authorization)

- Every action checks the signed-in person, their roles and the thing they touch, on the server.
- Row-level security is on for **every** table. Default: nobody. The database refuses even if the app has a bug.
- A person can only reach their own business's data. Every query is limited to it, so changing an address or id in the browser shows nothing (no IDOR).
- Only named fields can be changed, so nobody can slip in `role = owner` (no mass assignment).
- Roles can't give more than they have (see `../dashboard/shell-plan.md`).
- The master database key lives only on the server and is never sent to a browser.

## 5. What comes in and what goes out

- Every input is checked against a strict format (a schema) before use. Anything else is refused.
- Database access uses safe, parameterized queries only. No building queries from text.
- Text a person wrote (a blog post, a note) is cleaned with an allow-list before it is shown.
- Forms and actions check where the request came from (CSRF), and the request type.
- The server never fetches an address a user typed in (no SSRF). Redirects only go to our own pages.
- Files: type checked by content (not by name), size limited, renamed, images re-saved, stored privately, opened only through short-lived links. Never run or served from the app's own address.
- Errors shown to people are short and plain. Details go to the log, never the screen.

## 6. Secrets and keys

- Keys live only in the host's secret settings, one set for each client. Never in the code, the repo or a chat.
- Each client has their own keys. A leak in one client cannot open another.
- Keys have the least power they need (email sending only sends mail).
- Secret scanning is on in the repo, and a leaked key is replaced the same day.
- Keys are never printed in logs.

## 7. The code we depend on (supply chain)

- A lock file, few packages, and a look at any new package before adding it.
- Automatic alerts for known problems in packages, and updates every month.
- The main branch is protected: a change needs checks to pass before it ships.
- Real security settings are copied from one tested template, not rewritten for each client.

## 8. The accounts around it

These are as important as the code.

- **The client's accounts** (GitHub, hosting, database, email): the owner turns on two-step sign-in for each, with an authenticator app or a security key. This is part of setup, not optional.
- **Your own accounts:** a passkey or security key, a password manager, a separate email used only for this work, and two-step sign-in everywhere.
- **You are added by invitation**, never by sharing a password.
- Support access to their data is by the owner's time-limited permission only, and it is logged (see `../dashboard/shell-plan.md`).

## 9. Protecting the data

- Encrypted in transit and at rest.
- Only what is needed is collected. Fewer details means less to lose.
- Backups are stored where the client owns them, and a restore is tested every three months.
- Logs hold no personal details (no names, phone numbers or card numbers).
- A person's data can be exported and deleted on request.

## 10. Seeing and answering attacks

- The activity log is append-only. Nobody, not even the owner, can edit or delete entries.
- These events always alert the owner: many failed sign-ins, a new device for an owner, a role changed, support access turned on, a file download in bulk, a switched-off person trying to sign in.
- The status chip (see `../dashboard/shell-plan.md`) shows green, amber or red. No email is sent to you automatically; clients reach you through the contact link, so check each client's dashboard now and then.
- **Incident routine** (written once, kept short):
  1. Contain it: switch off the person or key, sign everyone out.
  2. Tell the client the same day, in plain words.
  3. Replace every key that could be affected.
  4. Restore from a backup if data was changed.
  5. Write down what happened and what changed.

## 11. Why many clients are safer this way

Each client has their own copy and database. One break-in cannot reach another client, and no key or setting is shared. That limits the damage of any single mistake.

## Testing before any client

- Role tests: each role cannot do what it should not, including by typing addresses and ids directly.
- Try to see another business's data (it must fail).
- Try the known attack classes (OWASP Top 10) against the sign-in and the forms.
- Check headers and cookies with an automatic scanner.
- Check packages for known problems.
- A restore test, and a "switch someone off" test.
- Ask an independent person to try to break it before the first paying client, once there is budget.

## Security "done" list for the shell

- [ ] Row-level security on every table, tested.
- [ ] Every action checks role and ownership, tested.
- [ ] Sign-in limits, expiry and no user guessing, tested.
- [ ] Owner second code and new-device alert work.
- [ ] Switching someone off ends their sessions.
- [ ] Headers and cookies set, scanner passes.
- [ ] Uploads: type, size, private, short-lived links.
- [ ] No secret in the repo, the browser or the logs.
- [ ] Packages checked, main branch protected.
- [ ] Activity log cannot be edited. Alerts reach you.
- [ ] Backup restored on a copy.
- [ ] Incident routine written and rehearsed once.

## What I cannot promise

Nobody can promise "no one can ever break in". We promise: strong defaults, tested roles, quick detection and a clear plan. Never write "unhackable" or "100% secure" in a sales page or a contract (see `../product/contracts.md`).
