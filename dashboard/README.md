# apps/dashboard

The dashboard code. **Status (2026-11-13): the empty shell runs.** Built so far, with no database needed: the shared toolbox (`src/kit`: permissions, money, time, errors), the system description format and the install check (`src/shell/systems`), the registry and menu, the shell frame (side menu on a computer, menu button and side sheet on a phone, light and dark mode), the Today screen, and the Branding screen with its colour-safety logic (`src/shell/branding`, live preview at /preview/branding). The three pilot systems have description files only (`src/systems/*/manifest.ts`); their pages and SQL are next. Sign-in, people and roles need your development Supabase project. Until sign-in exists the shell pages are reachable only in development, at /preview. Build from `../../docs/dashboard/shell-plan.md` (section "Build order") and follow the rules in `../../docs/`.

## Planned layout

```
apps/dashboard/
  src/
    app/           the pages (Next.js app router)
    shell/         sign in, people, roles, menu, Today, settings, branding, files, status
    systems/       one folder for each system (booking, content, payments, ...)
    kit/           the shared toolbox: permissions, database, screen parts, files, email, words, errors
    extensions/    this client's own changes (never overwritten by updates)
    lib/           the database layer in one place
  supabase/
    migrations/    numbered SQL files, copied into Supabase by hand in version 1
  tests/           role tests, install check, calculations
  scripts/         the "new system" script and the install check
```

## Stack

Next.js (App Router), React, Tailwind, Supabase (database, sign-in, storage), Resend (email), Vercel (hosting). Decided in `../../docs/dashboard/shell-plan.md`.

## Build order (from the shell plan)

1. Foundation: the project, the database layer, sign in, the shell frame, branding.
2. People: invites, roles, permissions, switching people off, the activity log.
3. Today and the menu.
4. Files and email.
5. The status chip.
6. Backups, trial mode, search.
7. The new-client script and the install check.
8. Test with a fake client, then the Dan Cafe pilot.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it with your own development Supabase project's values. Never commit `.env.local`.
3. `npm run dev` (opens at http://localhost:3000). Checks: `npm run typecheck`, `npm run lint`, `npm test`.

## Known package notes

`npm audit` still lists one high item: the copy of PostCSS bundled inside Next.js. It only handles our own CSS at build time, and the fix needs Next.js 16 (a major upgrade). Revisit when we upgrade Next.js. Test runner upgraded to Vitest 5 to clear its critical item.
