# Template for a new system's documents

Copy this folder's files into the new system's folder (`docs/systems/<system>/`) when a client asks for it. Do not write all of them before the client's questions are answered. Keep each short. Less is more.

| File | Answers |
|---|---|
| `README.md` (in the system's folder) | The one-line summary, status, tables, permissions, features, install and setup, rules |
| `prd.md` | Why: problem, users, goals, not goals, requirements with "done when", success, questions for the client |
| `design.md` | How: description file, tables, rules, public connection if any, screens, tests |
| `flow.md` | What people do, step by step, and edge cases |
| `roles.md` | Who can do what: permissions by role, and what follows the data |
| `api.md` | The doors it opens: public, staff actions, other systems, emails and jobs |

Order: write `prd.md` first, ask the client its questions, then `design.md`, `flow.md`, `roles.md` and `api.md`.

Shared documents to link instead of repeating: `../../architecture/system-design.md`, `../../architecture/data-model.md`, `../../dashboard/app-flow.md`, `../../rules/security.md`, `../../rules/rules.md`, `../../rules/frontend-rules.md`, `../../rules/naming.md`.

The three pilot systems are the examples: `../booking/`, `../payments/`, `../content/`.
