# Setting up a client's dashboard and website CMS

Decided 2026-11-22. Read this before you start any client. It says where the dashboard goes, what every client gets, and how to keep all clients the same.

## The rule

**A client's dashboard lives inside the client's website folder**, in a folder called `dashboard`:

```
Dev\Selah Pilates Studio\          the client's website (one git repo)
  app\  components\  content\ ...  the website
  dashboard\                       the dashboard, made from this master
```

Never a separate sibling folder such as `Dev\Selah Pilates Dashboard`. The website and its dashboard belong together: the dashboard edits the website's `content/`, so they share one repo, one owner and one hand-over. Dan Cafe (`Dev\Dan Cafe\dashboard`) is the model.

## The locked structure

Locked 2026-11-23. Inside the client's `dashboard` folder, every system goes in the same places for every client. The word is **system** in every folder and file name (the Portfolio's "module" is only a business grouping for pricing).

```
dashboard\
  src\
    systems\
      index.ts                the list of installed systems (one line each)
      booking\                a system's code. Its `site\` folder is the client's own part
      content\
    app\
      (shell)\booking\        a system's pages
      api\booking\            a system's public and private addresses
    kit\                      the shared toolbox, the same for every client
  docs\systems\booking\       a system's notes
  setup\
    business.json             the business's details, kept once (the name every system reads)
    booking.json              the answers given when a system was installed
```

Beside the website folder, never inside it: `Dan Cafe backup 2026-11-23 1432\` holds copies of what an update or an overwrite replaced.

| What | Where | Who owns it |
|---|---|---|
| A system's code | `src/systems/<id>/` | The master. An update replaces it, except `site/`. |
| A system's pages | `src/app/(shell)/<id>/` | The master. |
| A system's addresses | `src/app/api/<id>/` | The master. |
| A system's notes | `docs/systems/<id>/` | The master. |
| The list of systems | `src/systems/index.ts` | The installer writes one line for each. |
| The shared toolbox | `src/kit/` | The master. The same for every client. A system may use only this and its own folder. |
| The client's own part of a system | `src/systems/<id>/site/` | The client. Never touched by an update. |
| The business's details | `setup/business.json` | The client. |
| Install answers | `setup/<id>.json` | The client. |
| Keys | `.env.local` | The client. Never committed, never in a chat. |

**Why it is locked.** The installer places files from one definition (`apps/dashboard/scripts/layout.mjs`). The branch rules (`scripts/branchRules.mjs`) say which of those paths belong to which system. `tests/layout.test.ts` checks the two agree and that this page shows every place. A system never writes outside its own four places and `setup/`. Changing the structure is a decision: change `layout.mjs`, the test and this page together, and say why.

## Every client gets the same thing

- **The shell is identical for every client.** Sign in, people, roles, menu, Today, settings, branding, the frame and `src/kit` are never changed inside a client's copy, except for the client's own colour and name (Branding). If a client needs a change to the shell, change it here in the master first, then copy it out to every client.
- **The website CMS is the `content` system.** One standard for every client, installed with `install-system`. Parts only some businesses need (menu, events, reviews, classes) are optional parts of it, switched on for that client. Never write a second CMS for one client.
- **The master is the only place a shell or CMS change starts.** Fixing it only in a client's copy means the next client does not get the fix.

## Set up a new client

One command does steps 2 to 5 and prints anything it could not do (run it in `apps/dashboard` of the master):

```
npm run new-client -- "<the client's website folder>" --client="Client Name"
npm run install-system -- "<the client's website folder>" content
```

1. **The website folder comes first.** It has its own git repo and keeps everything the owner will edit in `content/` (plain data, no words typed into components), as the website's own `CLAUDE.md` says.
2. **`new-client` makes `<website folder>\dashboard`** from the master's committed `main` (uncommitted master changes are not copied, so commit the master first). It leaves out `.env.local`, `node_modules` and the master's copy and branch scripts, writes the master commit it copied from into `dashboard\README.md`, and never runs `git init` or `git commit` (the website's repo may hold other work).
3. **It walls the two apps apart**, so neither scans or builds the other: `"dashboard"` in the website's `tsconfig.json` exclude, `"dashboard/**"` in the `eslint.config.mjs` ignores, `@source not "../dashboard";` in `app/globals.css`, and the dashboard's `node_modules`, `.next`, `.env.local` and `content/local` in `.gitignore`. A place it cannot find is listed for you to do by hand.
4. **It gives the dashboard its own port** (3100; the website is on 3000).
5. **It runs `npm install` and `npm run check`** (skip with `--no-install`).
6. **`install-system` adds a system** from its `system/<word>` branch: its code, its own pages and API, and its notes (`dashboard\docs\systems\<word>`). It accepts the website folder or the dashboard folder, and does not commit in the website's repo.
7. **Keys go in `dashboard\.env.local`**, never in a chat or a commit. While developing, the dashboard saves changes to the website's `content/local` (never committed), and the website reads a file there in place of the committed `content/data` file of the same name. Live, the data is in Supabase.
8. **Put the client's name and colour in Branding**, and nothing else in the shell.

`--standalone` still makes the old layout (a new folder outside, with its own repo). Do not use it for a client with a website.

## The `mdash` command (from any folder)

Link it once on your computer: in `apps/dashboard` of the master, run `npm link`. After that, open a terminal inside the client's website folder (or any folder inside it, such as its `app` folder) and run:

| Command | What it does |
|---|---|
| `mdash init` | Puts the dashboard in this website (a `dashboard` folder). Asks the client's name, the kind of business, then which systems to add (arrow keys, Space to tick). |
| `mdash install booking` | Adds a system. If the system has starting questions (`setup.json` in its folder), they are asked with the arrow keys and saved in `dashboard/setup/<system>.json`. |
| `mdash list` | The systems you can add, with the ones already installed marked. |

**Already installed?** `mdash init` and `mdash install` say so and ask what to do. With `--update` or `--overwrite` they do not ask.

| Choice | What happens |
|---|---|
| Update | The dashboard's own code (or the system's) is brought up to date. Kept as they are: the systems already added, the client's keys (`.env.local`), the answers (`setup/`), the client's package scripts, and a system's `site/` folder (its pages, layouts and photo places). Packages that changed are listed, so you run `npm install`. |
| Overwrite | A fresh copy replaces everything, after a plain "yes". The keys and answers are put back. A dashboard overwrite starts with no systems. |
| Cancel | Nothing changes. |

Before an update or an overwrite, what is replaced is copied to a backup folder next to the website (`<website> backup <date and time>`), never inside it, so the website's own build and git never see it. Delete it when you no longer need it.

Answers can be given instead of asked: `mdash install booking --booking.mode=classes`. To name the folder instead of using the one you are in: `--to=<folder>`. `new-client` and `install-system` still work the same way from the master.

## Setting up the CMS for a new website (the analysis checklist)

Do these in order. The first one exists because photos were forgotten before: only the text was editable.

1. **Find every image first.** From the dashboard folder run `node src/systems/content/scanSite.mjs`. It lists the photo places (`<PhotoSlot slot="...">`), the ones built from a name, and every image that is not a photo place. If the website draws images with plain `<Image>` or `<img>`, change each one to a `<PhotoSlot>` (the website's `components/PhotoSlot.tsx` and `content/photos.ts` show how) or, for a logo or icon, list its file in `site/fixedImages.ts` with a reason.
2. **Give every photo place an entry in `site/slots.ts`:** its id, a plain label, where it shows, a hint for what photo suits, and the frame shape. `npm run check` fails (photoCoverage.test.ts) until none is missing, so this cannot be skipped.
3. **Then the words:** one entry for each page in `site/pages.ts` (the checks) and `site/layouts.ts` (the editor, section by section, with the photo places of that part listed under `photos`).
4. **The repeated things:** one description for each list in `site/lists.ts`, with its tab in the manifest.
5. **Business details and opening hours.**
6. **Layout:** the dashboard is full width by default (the shell's `main` has no maximum width, decided 2026-11-22). Do not add a `max-w-*` around a page or a form; only readable paragraphs keep a narrow width.
7. **Run `npm run check`.** All of the above is proved by the tests.

## Different industries, same CMS

The `content` system must fit any business: a pilates studio, a gym, a café, a construction company. So it is split in two:

- **The engine (identical for every client):** the editor screens, saving, photo upload, checks, hours, business details, and the page and list editors. It never names a business type.
- **The site definition (one small folder, `src/systems/content/site/`, different for each client):** which pages the website has, what each page's fields are (`pages.ts`), how they are laid out in the editor (`layouts.ts`), where photos go (`slots.ts`), and which lists the business keeps (`lists`).

What changes by industry is the lists, not the engine:

| Business | Its lists |
|---|---|
| Pilates studio, gym | Classes, trainers, plans and prices |
| Café, restaurant | Menu categories and items, events |
| Construction | Services, projects with photos, team |
| Shop, salon | Products or services with prices, team |

The pilates "classes" screen and the café "menu" screen are the same idea: a list of items with a name, text, price and photo. They become one generic list editor, set up by the site definition. Until that is built, the pilates classes screen is kept as an optional part and is not part of any other client's install.

A new client starts from a neutral definition (Home, About, Contact, hours, business details, no lists) and adds only the pages and lists the business needs. Selah's definition is the first worked example; Dan Cafe's is the second.

## Keeping clients the same

Before you start a new client, and after any change to the master shell or `content` system:

1. Compare the client's `dashboard\src\shell`, `src\kit` and `src\systems\content` against the master. They must match, ignoring line endings.
2. A difference is either a fix that belongs in the master (move it there first) or a mistake (copy the master's file back).
3. Note the master commit the client was copied from in the client's `dashboard\README.md`, so the next comparison starts from a known point.

## Today (2026-11-22)

- `new-client` and `install-system` follow this page and are tested on a copy of a website's config. A system may own its pages and API (`src/app/(shell)/<word>/`, `src/app/api/<word>/`); the branch rules know this.
- **The standard `content` system is on the local `system/content` branch** (engine, a `site/` folder for each client, and generic lists). It passes the dashboard's full check on the committed `main`. Nothing is pushed.
- **Selah** has a working copy inside its website (`Selah Pilates Studio\dashboard`) on the new engine. The old sibling folder `Selah Pilates Dashboard` is untouched and can be deleted once the new one is checked in the browser.
- **Dan Cafe** (`Dan Cafe\dashboard`, the `website` system) is **not** moved yet, on purpose: moving it blindly could break a CMS that works.
  - **Done (checked):** the engine's checks now hold Dan Cafe's real menu (categories, sections, price columns, items), reviews, gallery and announcement (on/off, two dates, an end-after-start rule). All of Dan Cafe's real data files validated against definitions written for them. The tests in the master use made-up data of the same shape.
  - **Still to build, in this order:** (1) the editor screens for a list inside a list, `strings`, `numbers` and `group` fields, and lists without ids (menu and reviews need these; the screen says so today); (2) business details set per client (`schema.ts` and its form move into `site/`: Selah has street, barangay and postal code, Dan Cafe has one address, a Google rating and a founding year); (3) boolean and date fields in the page editor, for the announcement; (4) Dan Cafe's special parts: photo upload with a blur preview and focus points, and the Home strip. Then Dan Cafe's `site/` is written and its data is checked against it before the old `website` system is switched off.
- Master `main` still has about 39 uncommitted shell files (the account page, avatar, scroll line, sign-in changes). Selah's and Dan Cafe's copies already contain them, so `new-client` from the committed `main` would give a client an older shell. Commit them first.
