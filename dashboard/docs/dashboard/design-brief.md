# Design brief

Written 2026-11-13. A one-page brief for how the dashboard looks and feels. The full rules are in `../rules/frontend-rules.md`. The working tokens are in `apps/dashboard/src/app/globals.css`. Rule zero for design work is in the repo's `CLAUDE.md`.

## What it is

A calm, branded business dashboard for a small business owner and their staff in the Philippines. They use it daily, often on a phone, between jobs. It should feel like a tidy tool, not a software product.

## Who uses it

- **The owner:** not technical. Wants to see what needs them today, and trust that nothing is lost.
- **Staff:** busy, on a phone, in a hurry. Need to record or find something in a few taps.
- **You (builder):** need to add a system without redesigning anything.

## Mode

Operate: scan, decide, act. Clarity and consistency beat expression. Personality lives in small, exact details.

## How it should feel

Calm, quiet, sure. Plain words. Room to breathe. Balanced "less is more": never busy, never bare or empty.

## The rules that decide most things

1. **Less is more, balanced.** One clear thing at a time. Cut words, not usefulness.
2. **Plain English.** Say "Bookings", never "system"; "Save", never "Submit"; no jargon.
3. **Colour is scarce.** Neutral surfaces, one accent the owner picks (blue by default). Status colours (success, warning, danger) are only for status, and always come with a word.
4. **Tokens only.** Colours, spacing and radii come from the shared tokens. Light and dark both work, with a smooth switch.
5. **One icon set.** Iconoir through the shared Icon, with weights that match the text.
6. **One menu shape.** A flat side menu on a computer, a menu button with a side sheet on a phone. A system's own pages are tabs along the top of its screen. The owner chooses the order.
7. **Phone first.** Works at 360, 768 and 1280 px. Touch targets are at least 44 px. Anything clickable shows the pointer.
8. **Fast and calm.** Loading shows a quiet skeleton after a short delay. Motion is short (about 200 ms), eased, and respects reduced motion.
9. **Accessible.** Text contrast meets WCAG AA (tested). Everything works with a keyboard and a screen reader. Never colour alone.

## Type and shape

One typeface (Geist). Sizes: page title 24 to 30 px, body 14 to 15 px, small notes 13 px. Corners: 8 px on controls, 12 px on cards. Borders over shadows.

## Standard parts

Side menu, phone menu sheet, system tabs, page title and one-line description, list rows, cards, form fields with a label and a note, tick boxes, the sliding choice control, the colour picker, empty states with one next step, skeletons, and one answer message shape. Systems use these from `@/kit`; they do not draw their own.

## For a system's screens

List the screens in the system's `design.md`: what each shows, and what is different on a phone. Use the shared parts. If a part is missing, add it to the shared toolbox for everyone.

## How we check

The structure tests refuse hand-written colours, clickable divs and pages without a loading state. A screenshot pass in light and dark at phone and computer width before anything ships.
