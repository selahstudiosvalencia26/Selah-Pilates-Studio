# Branching

Written 2026-11-13. How the code is kept in git so the dashboard and the systems never mix.

## The rule

- **`main` holds the dashboard only:** the shell, the shared toolbox, the tooling, and the documents that apply to every system (rules, the catalogue `docs/systems/README.md`, the `_template`, the `_parked` notes). There is no system on `main`, and the registry `src/systems/index.ts` there is empty.
- **Each system lives on its own branch, `system/<word>`,** for example `system/booking`. That branch holds only that system: its code folder `apps/dashboard/src/systems/<word>/`, its docs folder `docs/systems/<word>/`, and its one line in the registry.
- **Dashboard changes happen on `main`** (or a short branch that goes back into `main`). Never on a module branch.
- **Modules never merge into `main`.**

## How the two meet

- A module catches up with the dashboard by merging `main` into its branch. That direction is allowed and normal.
- A client's copy is built from `main`, then the wanted modules are merged in (for example `system/booking` and `system/payments`). Three scripts do this (run in `apps/dashboard`): `npm run list-systems [-- --for=food]` shows the systems and which are built; `npm run new-client -- <folder> --client="Name"` makes the client's folder and git repo from `main` and asks which systems to add (or take `--systems=booking,payments` to skip the question); `npm run install-system -- <folder> <word>` adds systems later. Systems are copied from their branch (no merge conflicts). Systems depend on the kind of business, so none are added by default. A system with plans but no code yet is refused. Nothing is pushed.
- To start a module: `git switch -c system/<word> main`, then `npm run new-system <word>`.

## What stops a mistake

1. **A check, `apps/dashboard/scripts/check-branch.mjs`.** On `main` (and any non-module branch) it refuses any file inside a system's folder. On `system/<word>` it refuses any file that is not that system's own folders or the registry. It is tested in `tests/branchRules.test.ts`.
2. **A local hook** runs it. `.githooks/pre-commit` checks what is about to be committed. `.githooks/pre-push` checks the whole branch and refuses to push any other branch onto `main`, or a module branch under another name. Turn the hooks on once in a new clone: `git config core.hooksPath .githooks`.
3. **A GitHub check, `.github/workflows/branch-rules.yml` ("Branch rules"),** runs the same script on every push and pull request. It also refuses a pull request from a `system/*` branch into `main`. It works even if someone skipped the local hook.
4. **GitHub branch protection on `main`** (a setting, done once in the repository's Settings, Branches): require a pull request, require the "Branch rules" check to pass, and block force pushes and deletion. Only this step needs a click on github.com. Without it GitHub flags a wrong push but does not block it.

## If it happens anyway

A module's files reached `main`: move them to their branch (`git switch -c system/<word>`, commit there), then remove them from `main` in a normal commit. A dashboard file reached a module branch: do the same the other way round. The check names each file.

## Names

`system/<word>`: one lowercase word, the same word as the system's `id` (see `../rules/naming.md`). Dashboard branches are anything else, for example `fix/menu` or `feature/people`.
