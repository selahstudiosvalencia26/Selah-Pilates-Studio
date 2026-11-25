# Modular dashboard: rules for anyone working here

A shell (sign in, people, roles, menu, Today, settings, branding) plus separate systems (booking, content, payments...) added one at a time, one copy per client. Plan in `docs/`, code in `apps/dashboard/`. Start with `README.md`, then `docs/dashboard/shell-plan.md` and `docs/dashboard/build-status.md`.

## Rule zero: less is more

This beats every other rule, and every design skill's advice. When two choices work, pick the one with less.

- **One purpose and one main action per screen.** If a screen cannot be explained in one sentence, split it or remove it.
- **Cut before you add.** Cut words, boxes, borders, colours, icons, settings and buttons first. A new feature must replace a step, not add one.
- **Nothing decorative.** No effect, gradient, shadow, badge, label or animation that does not carry meaning or state. No cards inside cards, no kickers above headings, no hero numbers, no filler text.
- **Hide the advanced.** Show the few things most people need. Fewer options, fewer toggles, fewer words.
- **Plain English.** Short everyday words, as if explaining to a coworker. A button says what it does.
- **Less is not ugly.** Keep spacing, alignment, type and motion crafted. Cut clutter, not care. Every detail that stays must be exactly right.
- **Balanced, not bare.** A screen should feel complete. If it looks empty, the answer is never decoration: add real information the person can use (a number, a status, a next step, the thing they came for, a realistic preview). If it looks busy, cut. Aim for the middle: everything on screen earns its place, and nothing useful is missing.
- **Before showing a design, ask two questions.** What can I remove? Then: does it still feel complete, with what the person needs in view? Fix the answer to whichever fails, and look again.

## More principles (full text in `docs/rules/principles.md`)

- **Ask why before you add.** Removing is harder than adding, so every addition earns its place. Knowing what not to build is the skill.
- **One clear task on every page.** Say in one sentence what the one thing to do here is. One primary button, with the other actions quieter. A button says what it does.
- **Every task takes the fewest steps.** Count the clicks. Sign out is one click in the side menu, never Settings, then Security, then Sign out. Common tasks are one or two clicks, hidden parts at most two levels deep, one way to reach each thing. A clear label beats a low count.
- **Familiar and forgiving.** Few choices, targets of at least 44 px, the usual place for account and sign out, short lists, accept input the way people type it.
- **Always show what is happening.** After every click: working, then done or failed. No silent buttons, no blank page while loading.
- **Undo instead of "Are you sure?".** Deleting goes to the recycle bin with an Undo. Ask first only when it cannot be undone, and say plainly what will happen.
- **An empty page tells you the next step.** It says what belongs here and offers the one action to start.
- **Plain errors, next to the problem.** Say what went wrong and how to fix it, beside the field, and keep what the person typed.

## Design skills work inside these rules

The installed skills (Impeccable, Emil Kowalski's design engineering, the taste skill, Vercel's web guidelines) are for review and polish. They never override this file or `docs/rules/frontend-rules.md`. This is an **Operate** surface (a work tool): calm, familiar, fast to scan. No hero sections, no showpiece animation, no decoration for its own sake. The taste skill is written for marketing sites, so use only what applies: its consistency and finish checks, not its landing-page moves.

## Design rules (full text in `docs/rules/frontend-rules.md`)

- Colour comes only from the tokens in `src/app/globals.css`. Light and dark are automatic. Never a hex colour, a Tailwind palette colour or `dark:` in a system. The accent is for actions and the current page, nothing else.
- Icons: Iconoir only, through `@/kit/Icon`. No other icon set, no drawn SVG.
- The frame (locked menu and locked rounded panel, content scrolls under it, scrollbar at the window edge) lives only in `src/shell/frame/Shell.tsx`. Pages never set their own height or scroll area. Details in `docs/rules/frontend-rules.md`.
- Everything clickable is a real link or button (pointing cursor, keyboard works). Never a clickable `div`.
- Accessible and responsive: keyboard, labels, 4.5 to 1 contrast, 44 px touch targets, checked at 360, 768 and 1280 px.
- **Every component gets a simple animation by default, without being asked.** Hover and press feedback on anything clickable, a smooth open and close for panels, menus and sheets, a fade or slide for things that appear, leave or change place, and a slide for the current tab. It shows state, runs 150 to 250 ms, uses only transform and opacity, and respects reduced motion. Keep it small: no showpiece effects, and none on things used hundreds of times a day.
- Speed budgets in `docs/rules/rules.md`: about 150 KB of JavaScript per page, content in under 2.5 seconds.

## Code rules (full text in `docs/rules/rules.md`, `docs/rules/security.md`, `docs/rules/naming.md`)

- A system uses only its own folder and `src/kit`. Tests in `tests/` enforce this.
- Every action is checked on the server. Never a secret in a file, a chat or the browser.
- SQL is numbered, safe to run twice, row-level security on. Money is never deleted.
- Keep the plan in step with the code: when a decision changes, change the doc in the same sitting.

## Setting up a client

A client's dashboard goes **inside the client's website folder** (`<website>\dashboard`), never in a separate sibling folder, and every client gets the same shell and the same `content` CMS from this master. Steps and the sameness check: `docs/architecture/client-setup.md`.

## Commands (in `apps/dashboard`)

`npm run dev` (port 3100 in this setup), `npm run check` (typecheck, lint, tests), `npm run new-system <word>`.
