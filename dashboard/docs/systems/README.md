# Systems

Every system we could offer, filtered into three groups. A **system** is one part of the dashboard (see `../product/modular-dashboard.md`). Folder names follow `../rules/naming.md`.

**How they were sorted.** A system is **necessary** when many kinds of business use it, it is used every day, it is low risk, and no other system already does the job. It is **useful** when a good number of clients would want it but they can live without it at first. It is **parked** when it repeats another system, is only a view, is niche, or is big or risky.

## Modules: how a client chooses (decided 2026-11-19)

A client does not choose from 31 systems. They choose from **8 modules**, each a group of systems that belong together, and a package counts **modules** ("Core includes 3 modules"), not single systems. Every system below is in exactly one module. The code does not change: it stays one folder and one branch per system. A module is only a way to choose, describe and price.

| Module | Systems inside | In plain words, for a client |
|---|---|---|
| **Customers** | customers, messages, feedback, loyalty, vouchers | Keep track of the people you sell to |
| **Bookings** | booking, calendar, queue | Take and manage bookings and reservations |
| **Money** | payments, sales, invoices, quotes, expenses, memberships, reports | Keep track of the money coming in and going out |
| **Orders and jobs** | orders, projects, pos, delivery | Keep track of orders and the work to be done |
| **Stock** | inventory, purchasing, assets | Keep track of what you have and what you need |
| **Team and office** | staff, attendance, tasks, documents | Organize your team and your everyday office work |
| **Website** | content, forms | Update your website's content yourself |
| **Special industries** | students, patients, payroll | For businesses with special needs: we talk it through together. **Quoted by hand**, never sold from the list |

How it is used:
- **The words a client sees are general on purpose.** They say what a module is for, not a list of features, so nothing is promised that is not built or agreed.
- **The client's questionnaire** (the portal's dashboard Discovery) shows these 8 choices, each with its one line. What they pick becomes the owner's starting list of systems.
- **The setup screen** counts modules: a package that includes 3 modules is 3 of these groups, however many systems are inside them.
- **Built so far:** only `booking` (Bookings), `payments` (Money) and `content` (Website) have code. A module is "ready" only when the systems the client needs inside it are.
- **Parked systems** (the 17 below) stay parked. A client who picks a module that contains one only gets it if they ask for it by name, and it is quoted like any new system. `payroll`, `patients` and `students` are never offered from the list.
- The portal keeps its own copy of this table (`apps/portal/lib/projectSetup.ts`, `MODULES`). Change both together.

## Necessary: build first (6)

| System | What it does | Used by |
|---|---|---|
| [`customers`](customers/README.md) | The people who buy: a profile, notes and their history. | all industries |
| [`payments`](payments/README.md) | Money received: record it, link it to what it is for, keep the proof. | all industries |
| [`booking`](booking/README.md) | A held time, table, room or resource: appointments, reservations, classes, stays. | food, fitness, beauty, health, resorts |
| [`inventory`](inventory/README.md) | Stock: what you have, what moved in and out, and what is running low. | food, beauty, trades, health, shops |
| [`orders`](orders/README.md) | Orders typed in by staff from Messenger, phone or walk-in. Manual first. | food, trades, shops |
| [`content`](content/README.md) | The client edits their website's words, menu or services, photos and blog. | all industries with a website |

## Useful: build only when a client asks (8)

| System | What it does | Used by |
|---|---|---|
| [`staff`](staff/README.md) | The people who work there: a list, a weekly schedule and time off. | food, beauty, trades, health |
| [`tasks`](tasks/README.md) | A simple to-do list with due dates, owners and reminders. | all industries |
| [`expenses`](expenses/README.md) | The business's own costs: record, categorize, and see profit. | all industries |
| [`quotes`](quotes/README.md) | An estimate before the work, sent as a link and turned into an order or booking. | trades, printing, events, catering |
| [`invoices`](invoices/README.md) | Invoices sent to customers, from an order, booking or quote. | trades, printing, agencies, events |
| [`memberships`](memberships/README.md) | Plans people pay for repeatedly, with start and end dates and renewal reminders. | fitness, schools, clinics, laundry |
| [`messages`](messages/README.md) | Saved replies and templates to copy into Messenger, SMS or email. | all industries |
| [`feedback`](feedback/README.md) | Ask customers how it went, privately, and share the good ones. | food, beauty, health, fitness, shops |

## Not necessary now: parked (17)

Kept in `_parked/` so the ideas are not lost. Each says why it is parked, and where it merged if it did. Bring one back only if real clients ask for it.

| System | What it does | Used by | Why parked |
|---|---|---|---|
| [`assets`](_parked/assets/README.md) | Equipment: a list, who has it, and when it needs service. | trades, fitness, food, health | Niche. Only a few clients would use it. |
| [`attendance`](_parked/attendance/README.md) | Staff clock in and out, late and absent, hours per week. | food, fitness, beauty, trades | Overlaps `staff` (who works when). Clocking in and out is mostly needed for payroll, which is parked. |
| [`calendar`](_parked/calendar/README.md) | One calendar of everything: bookings, orders due, tasks, shifts. | all industries | Not a real system, only a view. It becomes a calendar view inside `booking` and Today. |
| [`delivery`](_parked/delivery/README.md) | Dispatch: assign a rider, track status, keep proof of delivery. | food, shops | Big. Needs maps and tracking. Later. |
| [`documents`](_parked/documents/README.md) | The business's own papers: permits, contracts, IDs, with renewal reminders. | all industries | The shell's file service already stores files. Permit reminders can be a small shell feature later. |
| [`forms`](_parked/forms/README.md) | Simple public forms that create a customer, booking or order. | all industries | Overlaps `content` (website forms), `booking` (public page) and `orders`. Public forms live inside those. |
| [`loyalty`](_parked/loyalty/README.md) | Stamps or points for repeat customers, and rewards. | food, beauty, shops, fitness | A nice extra, not needed to run the business. |
| [`patients`](_parked/patients/README.md) | Private records for clinics and dentists, with strict access. | health | Sensitive personal information. Needs written rules and a lawyer's check first. |
| [`payroll`](_parked/payroll/README.md) | Pay for staff: hours, pay, deductions. | all industries with staff | Risky: tax and labor rules. Do not build without an accountant and a lawyer. |
| [`pos`](_parked/pos/README.md) | A cashier screen: items, discounts, payment methods, closing the shift. | food, shops | Large and risky. Many cafés already use a cashier app. Build only if clients ask. |
| [`projects`](_parked/projects/README.md) | Jobs with milestones, tasks, deadlines and client approvals. | trades, agencies, construction, events | Overlaps `tasks` and `orders` (shown as a Job). Use those until a client needs milestones. |
| [`purchasing`](_parked/purchasing/README.md) | Buying from suppliers: purchase orders and receiving stock. | food, shops, trades, health | Merged into `inventory` (suppliers and low-stock lists). Split it out only if clients need purchase orders. |
| [`queue`](_parked/queue/README.md) | Walk-in queue numbers and who is next. | health, beauty (barbers), government-style offices | Niche (clinics, barbers). Only if a client asks. |
| [`reports`](_parked/reports/README.md) | Ready-made answers, not tables: money in, busiest times, top items, who owes. | all industries | Not a separate system. Each system shows its own few answers and Today shows the rest. Revisit if clients want reports across systems. |
| [`sales`](_parked/sales/README.md) | A simple daily sales record. Not a cash register. | food, shops | Merged into `payments`, which already shows totals by day and month. A separate system would repeat it. |
| [`students`](_parked/students/README.md) | Schools and training centers: enrollment, classes, attendance, fees. | schools, training centers | Only schools and training centers, and children's data needs extra care. Later. |
| [`vouchers`](_parked/vouchers/README.md) | Gift cards and promo codes. | food, beauty, shops, fitness | A nice extra, not needed to run the business. |

## Suggested build order

1. The shell.
2. **The pilot (decided 2026-11-12): `booking`, `content` and a small `payments` for Dan Cafe** (a deposit recorded against a booking, with a proof photo). Then the other necessary systems.
   - Why it is a good test: `booking` has a public page and emails, and `content` feeds the website, so together they exercise the public connection, the setup flow, updates and the rules.
3. A useful system only when a client asks (and charge for it as an add-on or a Custom package).
4. Nothing from `_parked/` without a real client asking.
5. `payroll` and `patients` only with an accountant or lawyer.

## How every system installs and sets up

Every system follows the same three steps (decided 2026-11-12, see `../dashboard/shell-plan.md`). Build each one so it fits:

1. **Install.** The system's folder is added to the dashboard's `systems/` folder through GitHub. Its description file declares its pages, permissions, tables, emails, Today cards, and `requires_shell` (the dashboard versions it works with).
2. **Database updates.** The system ships numbered SQL files (`001_...sql`, `002_...sql`). The dashboard's Database updates screen lists the ones not yet applied. Each has a **Copy** button, to paste into the Supabase SQL editor. The dashboard then checks that the tables exist and marks the step done. It never runs SQL itself in version 1, because that would need a master database key.
3. **System setup.** The system asks its few starting questions (for example the booking hours), fills its default permissions (Owner everything, Manager view, edit and approve, Staff view and edit, unless the system says otherwise), and can load sample data that one press clears.

Rules for every system's SQL:
- Idempotent: safe to run twice (`create table if not exists`, `add column if not exists`).
- Table names `<system>_<plural>`, row-level security on, a `deleted_at` column on anything that holds a person's work (the recycle bin).
- Never edit a file that has been applied. Add a new numbered file instead.
- Public pages (booking form, order link, feedback form) are built on the client's website, which talks to the system through its small locked public connection. They never use the staff sign-in.

## Documents for each system

Every system has a `README.md` (the summary and rules). The three pilot systems (`booking`, `content`, `payments`) also have a `prd.md` (why and what), a `design.md` (how) and a `flow.md` (the steps). Other systems get the same three files when a client asks for them. Start from `_template/`.

## Rules every system follows

Each system's README has a "Rules for this system" section. The shared ones: **less is more**, **looks like the dashboard** (shared toolbox, the client's accent, no hand-written colors; light and dark mode come free from the colour tokens; Iconoir icons only, through the toolbox; every clickable is a real link or button with the pointing hand), **accessible** (keyboard, labels, contrast, errors, focus, reduced motion), **responsive** (phone first, touch targets, tables become cards, checked at 360, 768 and 1280 px), **backend and database** (thin routes, the database enforces the rules, indexes, paging, safe to repeat, background jobs), **front-end speed** (server components, no waterfalls, budgets on a slow phone), **safe by default** (server checks, row-level security, checked input, private files, recycle bin, activity log) and **done means it passes the install check and its tests**. Each system also lists what to watch for in its own area. The full rules are in `../rules/frontend-rules.md`, `../rules/rules.md` and `../rules/security.md`.

## The install check

Before a system is switched on, the dashboard checks its structure (names, permissions, tables, SQL files, versions, clashes). It runs automatically before a change ships, and again on the Systems page. A system that fails stays off and says why. The full list is in `../dashboard/shell-plan.md`, under "Install check and the shared toolbox".

## Adding or moving a system

Before making a new folder, ask: can this be an existing system plus settings? Only add a new one when two or more clients would use it, or a client pays for it as a Custom package (see `../product/systems.md`). To bring a parked system back, move its folder up one level and change its status.

## Permissions every system must follow (decided 2026-11-13)

- Declare `<id>.view`. The install check refuses a system without it.
- Declare the other actions only if they exist: `edit`, `approve`, `delete`, `manage`. The Roles screen builds its "None / See / Change / Approve / Everything" choice from what you declare, so write each label as a plain sentence ("See bookings", "Add and change bookings").
- When a screen shows another system's data, check that system's permission for that part and leave it out when the person lacks it. Permissions follow the data, on screens, Today cards, search and emails.
- A link to another system (`optional`) only adds a part. It never grants access.

## Where each system's files live

On `main` this catalogue, the `_template` and the `_parked` notes are the only system documents. Each system's own folder (`docs/systems/<word>/`) and its code (`apps/dashboard/src/systems/<word>/`) live on the branch `system/<word>`, so the links to those folders above work on that branch (see `../architecture/branching.md`).
