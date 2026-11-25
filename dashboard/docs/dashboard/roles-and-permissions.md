# Roles and permissions

Written 2026-11-13. Who can do what, and the rules behind it. The design and the build detail are in `../architecture/system-design.md` (section 6) and `shell-plan.md` (section 2). The code is `apps/dashboard/src/shell/people/roles.ts` and `src/kit/permissions.ts`, with tests.

## The three links

A **person** has **roles**. A **role** has **permissions**. A **permission** belongs to one **system** (its name starts with the system's word, for example `booking.approve`). Nothing else is stored.

- Actions are only: `view` (see), `edit` (add and change), `approve` (confirm, publish, void), `delete`, `manage` (settings).
- Permissions add up across a person's roles.
- The Owner role holds everything (`*`) and is locked.

## The people

| Who | How they get in | What they can do |
|---|---|---|
| **Builder (you)** | Set up the first owner. Support access is a temporary, logged invitation. | Install, update and remove systems. Never a daily user. |
| **Owner** | Created by the builder with the owner's email. | Everything: people, roles, branding, menu order, all systems. |
| **Manager** | Invited by the owner. | Day-to-day work in every system, can approve. Can invite staff, not owners. |
| **Staff** | Invited by the owner or a manager. | See and change records in the systems they are given. |
| **Custom roles** | Made by the owner ("Cashier", "Front desk"). | Whatever the owner ticks, never more than the maker has. |
| **A stranger** | The public website. | Only the public connection of a system (see `../architecture/api.md`): send a request, see free dates. Never a sign-in. |

## The starting roles, system by system

| Permission | Owner | Manager | Staff |
|---|---|---|---|
| `booking.view`, `booking.edit` | yes | yes | yes |
| `booking.approve` (confirm or decline) | yes | yes | no |
| `booking.delete`, `booking.manage` | yes | no | no |
| `content.view` | yes | yes | yes |
| `content.edit`, `content.approve` (publish) | yes | yes | no |
| `content.manage` | yes | no | no |
| `payments.view`, `payments.edit` (record) | yes | yes | yes |
| `payments.approve` (void) | yes | yes | no |
| `payments.manage` | yes | no | no |

Each system declares its own defaults in its description file. They apply once, when the system is added. The owner can change any role afterwards.

## Dashboard-level actions

| Action | Who |
|---|---|
| Invite, switch off or change a person's roles | Owner. Managers may invite staff only. |
| Make or edit a role | Owner. A manager cannot make a role stronger than a manager. |
| Branding and menu order | Owner |
| Systems page (install, update, remove) | Builder only |
| Status button, backups, activity log | Owner |

## The rules

1. **Every action needs "see".** Each system must declare `<id>.view`. Ticking any action also ticks "see". Unticking "see" clears the rest of that system.
2. **One choice per system.** The Roles screen shows None, See, Change, Approve or Everything for each system, built from what the system declares. "Customize" opens the detailed ticks.
3. **Permissions follow the data.** Where a screen, Today card, search result, email or file shows another system's data, it is checked against the system that owns that data, and left out when the person may not see it. Linking two systems never grants access.
4. **Nobody gives more than they have.** A manager cannot invite an owner. There is always at least one owner.
5. **Deny first, then check the thing.** Every action checks the permission on the server, then checks that the thing belongs to this business, then acts. The database's row-level rules check again.
6. **Sensitive actions ask for confirmation:** delete, approve and manage.
7. **Lifecycle.** A new system gives Owner access at once. Switching one off keeps the ticks. Removing one deletes them. All changes go in the activity log and apply at once.
8. **Switching a person off** signs them out within a minute. Their work stays.

## Tests that must stay

Staff cannot confirm a booking. A manager cannot invite an owner. Unticking "see" clears a system. A role cannot be given more than its maker has. A person with only `payments.view` sees no payment amounts inside a booking. The install check refuses a system without `<id>.view`.
