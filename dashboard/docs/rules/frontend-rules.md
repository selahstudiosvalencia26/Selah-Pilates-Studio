# Front end, speed and accessibility rules

Our own rules. Written 2026-11-11. Backend and database rules are in `rules.md`, names in `naming.md`.

## Rule zero: less is more

This rule beats every other rule, and every design skill's advice (Impeccable, Emil Kowalski's, the taste skill). The skills help us review and polish; they never add things. It is also written at the top of `CLAUDE.md`, which every assistant reads first. When two choices work, pick the one with less.

- One purpose and one main action per screen.
- Cut words before adding any. If a sentence can lose a word, it loses it.
- Cut boxes before adding any. Prefer a flat list with thin lines over cards inside cards.
- Hide advanced options. Show the few things most people need.
- Fewer settings, fewer colors, fewer fonts, fewer buttons.
- A new feature must replace a step, not add one. Ask: does this remove work for the client?
- If you cannot explain a screen in one sentence, split it or remove it.
- Nothing decorative: no effect, gradient, badge, label or animation that does not carry meaning or state. No cards inside cards, no small label above a heading, no big number for show.
- Before showing a design, ask what can be removed. Remove it, then look again.
- Less is more does not mean ugly. Keep spacing, motion and polish. Cut clutter, not care.
- **Balanced, not bare.** A screen must also feel complete. If it looks empty, add real, useful information (a status, a count, the next step, a realistic preview), never decoration. If it looks busy, cut. Test every screen both ways: what can go, and what is missing?

## Screens and words

- Plain English. Short, everyday words, as if explaining to a coworker. No jargon.
- One writing style, decided once: sentence case for buttons and titles ("Add customer").
- A button says what it does ("Save receipt"), never "Submit" or "OK".
- Every list has three states: loading, empty (with the next step) and error.
- Mobile first. No sideways scrolling. A table becomes a stacked list on a phone.
- Always show the next step. A screen never ends with nothing to do.
- **Long lists never open all at once.** Show the list of groups first, and open one group at a time (a list on the left and one group on the right on a computer; list first, then the group, on a phone). A screen never shows more than one long list of items.
- **Rows look like a printed list, not a form.** Show only what people read and change most (for example a name and its prices), in boxes that look like plain text until you point at them. Everything else (description, order, remove) is behind one "Edit" on that row.
- **One main action, one Save.** Rarely used settings go behind a "Settings" link on the group, closed by default.
- If a screen needs more than a few seconds to understand, it is too much. Cut it before you show it.

## Shared parts

- The shell owns one set of parts: Button, Input, List, Sheet (side panel), Modal, Toast, EmptyState, Loading. Systems use them and never make their own.
- Colors, spacing, corner size and fonts live in one tokens file. A system never writes a color by hand.
- Same look everywhere, so a system feels like part of the shell.

## Saving (the standard, decided 2026-11-23)

**Every form that saves changes ends with the one Save bar, `<SaveBar />` from `@/kit/SaveBar`.** This holds in the shell and in every system. Never make a Save button row or a sticky bar of your own.

- **Where it is.** It stays at the bottom of the screen while the form scrolls under it, and rests at the end of the form when you reach it.
- **Why it is a shared part.** It lines up with the frame's rounded panel: 8px above the window's edge like the panel, the panel's full width, following its rounded corners. A bar that sticks to the window's very edge crosses the panel's border and looks broken. One part means nobody gets this wrong, and every screen saves the same way.
- **Its states.** Greyed out until something changed. "Saving" while it works. Beside it, in plain words, what happened: "You have changes that are not saved yet", "Saved", or what went wrong and how to fix it.
- **How to use it.** Inside a `<form>`, drop it in with `dirty`, `pending` and `message`: the button submits the form. For a screen made of several parts, pass `onSave`. A quieter action such as Reset goes inside it as a child.
- **Enforced.** `tests/architecture.test.ts` fails if any file other than `kit/SaveBar.tsx` writes `sticky bottom-`. `src/kit/SaveBar.test.ts` checks the bar's words, its states and its fit to the frame.

## Form controls (the standard, decided 2026-11-23)

**The toolbox (`@/kit`) has one of each form control. Every screen in the shell and in every system uses them, and never the browser's own.** The browser's dropdown and clock box look different in every browser, cannot be styled, and are poor on a phone.

| For | Use | Notes |
|---|---|---|
| A word or a number | `Input` (with `Field`) | An icon at the start is optional (`icon="user"`). Text is 16 px on a phone, so it never zooms in when tapped. |
| Longer text | `Textarea` (with `Field`) | Same look as `Input`. |
| Choosing one thing from a list | `Select` | Opens right under the field on a computer, and as a sheet from the bottom of the screen on a phone. |
| A time of day | `TimeSelect` | A list of times ("6:00 PM"), built on `Select`. Not `<input type="time">`. |
| A setting that is on or off | `Toggle` | A switch. The whole row is the press target. |
| Choosing several things | `Tick` | A tick box with a whole-row press target. |
| A label, a hint and a plain error | `Field` | Connects the label and the words to the box for the keyboard and for screen readers. |

- **Every control is at least 44 px high**, a thumb's size, and every row in a list the same.
- **Keyboard and screen reader.** `Select` has arrows, Home, End, typing letters, Enter or Space to pick, Escape to close. It is announced as a list box. `Toggle` is a real switch and says "On" or "Off" in words.
- **Motion.** A popover drops in and a sheet slides up, in 150 to 240 ms, opacity and transform only, and still for people who ask for less motion.
- **Colour.** Only the tokens in `globals.css` (a dim layer behind a sheet is `bg-scrim`). Light and dark come free.
- **A date** may still use the browser's date box, because a phone's own date picker is the best one there is.
- **See them.** In development, `/preview/components` shows every control to try on a computer and on a phone.
- **Enforced.** `tests/architecture.test.ts` fails on a `<select>` or a `type="time"` outside the toolbox. `src/kit/controls.test.ts` checks the controls' keyboard rules and what they put on the page.

## Forms and feedback

- Every input has a visible label.
- Check on save, with a clear message next to the field. Keep what the person typed.
- Disable the save button while saving, so it cannot be pressed twice.
- Ask before anything destructive. Say what will be lost.
- After a save, copy or delete, show a short toast.
- **Every component has a simple animation by default.** Nobody should have to ask for it: hover and press feedback on anything clickable, a smooth open and close for panels, menus, sheets and details, a fade or slide when something appears, leaves or changes place, and a slide to the current tab. It is short (about 150 to 250 ms), shows state, and is small. No showpiece effects. Respect "reduce motion".

## Optimization (front end)

Targets on a mid-range phone with a slow connection:

- The main content shows in under 2.5 seconds.
- Pressing a button responds in under 200 ms.
- Nothing jumps while loading (layout shift under 0.1).
- Lighthouse score 90 or higher on the main pages.

How:

- Load data on the server by default. Send little JavaScript to the browser.
- Each system's code loads only when opened. A system not bought adds nothing.
- Lazy-load heavy parts (charts, editors). Think twice before adding a big library for a small job.
- Images: modern formats, the right size, lazy loading, and fixed dimensions so the page does not jump.
- At most two font families, with a fallback shown at once.
- Fetch things in parallel, not one after another.
- Wait a moment after typing before searching. Very long lists (200 or more rows) show only what is on screen.
- Before giving a system to a client, try it on a slow phone.

**Best practices (added 2026-11-13)**

- **Server components by default.** A screen is drawn on the server. Only the small part that needs a click, a keystroke or the browser is a client component, and it sits at the leaf, not around the whole page.
- **No waterfalls.** Start every fetch at once (`Promise.all`), and never fetch inside a loop of components. Share the same fetch between parts with one cached call.
- **Show the page, then the slow parts.** Wrap slow parts in a loading boundary so the rest appears at once (streaming). Every route has a loading state that matches the final shape, so nothing jumps.
- **Reserve space.** Give images, charts and anything that loads later a fixed size or ratio.
- **Images** use the framework's image part: the right size, AVIF or WebP, lazy by default, and "priority" only for the one big picture at the top.
- **Fonts:** the system font stack costs nothing. If a brand font is needed, load one family with a fallback shown at once.
- **Small bundles.** Import one icon, not the whole set (the toolbox already does). Prefer the browser's own `Intl` for dates and money over a library. Check what a new package adds before keeping it.
- **Load heavy things when needed.** Charts, editors and calendars are loaded when opened (`next/dynamic`), not with the page.
- **Update the screen at once, check after.** For safe actions (ticking a task, marking a message read), show the result immediately and undo it if the server says no. Never do this for money.
- **Forms** use server actions, show a pending state, keep what was typed on error, and ignore a second press while saving.
- **Long lists:** page them on the server, and draw only the rows on screen once a list passes about 200 rows. Wait a moment after typing before searching.
- **Animate only `transform` and `opacity`.** They are smooth on a cheap phone. Never animate size or position that makes the page reflow.
- **Avoid needless re-drawing.** Keep state as low and as small as possible, derive what you can instead of storing it, and use stable keys. Reach for memoizing only after measuring.
- **No third-party scripts** (trackers, chat widgets) unless a client asks, and then loaded late.
- **Measure, do not guess.** Run Lighthouse and a slow-phone profile (4x slower CPU, slow 4G) before giving a system to a client. The numbers above are budgets, not hopes.

## The frame and how it scrolls (decided 2026-11-14)

The frame is drawn once, in `src/shell/frame/Shell.tsx`, so every page and every system gets it for free. Do not rebuild it per page.

- On a computer the menu on the left is locked to the screen height. The page panel on the right is a rounded panel with an 8px frame around it, also locked to the screen.
- Only the content moves when you scroll. The panel, its corners and the menu stay still. The scrollbar sits at the edge of the window, not inside the panel. (One column scrolls, and the rounded frame is a sticky layer drawn over it.)
- The page area is full width (decided 2026-11-22): `main` in `Shell.tsx` has no maximum width, and no page or form adds a `max-w-*` around itself. Only a paragraph of reading text keeps a narrow width (`max-w-2xl`).
- The page column has no scrollbar (decided 2026-11-21): nothing is drawn and no room is reserved, so the panel reaches the window edge and the width never changes. Wheel, trackpad, touch and keyboard scrolling are unchanged. Other scrolling boxes keep the browser's own scrollbar, not restyled.
- On a phone the whole page scrolls as normal and the rounded panel scrolls with it. There is no bottom bar: a menu button in the top line opens a side sheet with every place, so ten systems fit as easily as three.
- A page never sets its own height or its own scroll area. Never use `position: absolute` (including `sr-only`) inside a box that clips and is not `relative`: it escapes the clip and adds empty space at the bottom.

## Light and dark, icons and the pointer (decided 2026-11-13)

**Light and dark mode**
- Every person can switch between light and dark (the button in the menu). With no choice made, the dashboard follows their device. The choice is kept in a cookie, so the first paint is already right and nothing flashes.
- The switch crossfades the whole page (the View Transitions API), and does nothing for people who ask for reduced motion.
- A system gets both modes for free by using only the colour tokens in `src/app/globals.css`: `background`, `surface`, `border`, `text`, `text-soft`, `accent`, `accent-ink`, and the states `success`, `warning` and `danger`. Never a hex colour, never a Tailwind palette colour such as `bg-red-500`, never `dark:` or `prefers-color-scheme`.
- Use the state colours for meaning: success (done, paid, confirmed), warning (waiting, near a limit), danger (failed, cancelled, needs help). Add a word or an icon too, never colour alone.
- Adding a colour means defining it for light and dark. `tests/theme.test.ts` fails if one is missing, or if a system writes its own dark-mode code.

**Icons**
- One icon set: **Iconoir** (iconoir.com, MIT licence). It is used only through the toolbox: `<Icon name="calendar" />` from `@/kit/Icon`.
- A system names its menu icon in its description file (`icon: "calendar"`). The name must be listed in `src/kit/iconNames.ts`; the install check refuses one that is not. To use a new icon, add its name and its Iconoir picture in the toolbox once, and every system can use it.
- No other icon package, and no hand-drawn or pasted SVG icons.
- **Icon weight matches the text beside it.** `<Icon weight="regular" />` for regular text (400), `medium` for medium (500), `semibold` for semibold (600), `bold` for bold (700); `light` only for large icons. An icon never looks thinner or heavier than its label. The current page in the menu uses a heavier icon because its label is heavier.

**The pointer**
- Everything clickable shows the pointing-hand cursor, and anything switched off shows it cannot be used. The dashboard does this for every real link and button (`src/app/globals.css`), so a system does nothing extra.
- Make a clickable thing a real `<a>` or `<button>`, never a `<div>` with a click handler. That also makes it work with the keyboard. A test fails if a system makes a `<div>` clickable.

## Accessibility

Aim for the WCAG 2.2 AA level.

- Everything works with the keyboard alone, with a visible focus ring and a logical tab order. Escape closes panels. Focus returns to where it was.
- Text contrast is at least 4.5 to 1 (3 to 1 for large text). Never use color alone to mean something. Add words or an icon.
- Use real elements: button, link, list, table, label. Never a clickable box.
- Every icon-only button has a name. Every picture has alt text, or empty alt if it is only decoration.
- One main heading per page, headings in order, and clear page regions.
- Announce toasts and errors to screen readers.
- Touch targets are at least 44 by 44 pixels.
- The page still works at 200% zoom and with large text. No important text inside images.
- Before delivery: one keyboard-only pass, one screen reader spot check, and an automatic accessibility check.
