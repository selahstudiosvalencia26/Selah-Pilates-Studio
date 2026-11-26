import Link from "next/link";
import type { MenuItem } from "@/shell/menu";
import Icon from "@/kit/Icon";
import { BUILDER_CONTACT_URL } from "@/shell/builder";
import SystemsGrid from "./SystemsGrid";
import AddSystemHint from "@/shell/systems/AddSystemHint";
import { notAdded, offerFor } from "@/shell/systems/catalogue";
import SystemPoints from "@/shell/systems/SystemPoints";

// The home screen (docs/dashboard/shell-plan.md, section 4). Before any system has anything to say, it is a short first-run
// checklist, so it is useful on day one. Each step opens the place where it is done. Systems add their own cards later.
// Owners never install systems: the builder gets a link to the Systems page, an owner gets "Message me".
type Step = { title: string; hint: string; href: string; external?: boolean };

export default function Today({
  name,
  systems,
  installHref,
  warning,
  canInvite = true,
}: {
  name: string;
  systems: MenuItem[];
  installHref?: string;
  canInvite?: boolean; // inviting staff is not available yet on a live site
  warning?: { words: string; href: string }; // something that needs the owner, such as the domain running out
}) {
  // What this dashboard does not have yet, shown greyed out so the owner can see what exists. Not links: nothing can be opened.
  const more = notAdded(systems.map((s) => s.id));
  const steps: Step[] = [
    {
      title: "Add your business name and logo",
      hint: "So your team sees your name, not ours.",
      href: "/preview/settings",
    },
    ...(canInvite
      ? [{ title: "Invite a staff member", hint: "They sign in with a code sent to their email.", href: "/preview/people" }]
      : []),
    installHref
      ? {
          title: "Add what you need",
          hint: "Pick the tools your business needs.",
          href: installHref,
        }
      : {
          title: "Set up your dashboard",
          hint: "Message me and I will add the tools your business needs.",
          href: BUILDER_CONTACT_URL,
          external: true,
        },
  ];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.015em]">
          Hello, {name}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-soft">
          Here is what needs you today.
        </p>
      </div>

      {warning ? (
        <Link href={warning.href} className="card flex min-h-20 items-center gap-3 p-5 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-6">
          <Icon name="warning" weight="medium" className="h-5 w-5 shrink-0 text-warning" />
          <span className="text-sm font-medium">{warning.words}</span>
        </Link>
      ) : (
      <section aria-labelledby="today-empty" className="card p-5 sm:p-6">
        <h2 id="today-empty" className="text-base font-semibold">
          Nothing needs you right now
        </h2>
        <p className="mt-1 text-sm text-text-soft">
          When something does, like a new booking request, it shows up here.
        </p>
      </section>
      )}

      <section aria-labelledby="first-steps">
        <h2 id="first-steps" className="text-base font-semibold">
          Get started
        </h2>
        <ol className="mt-3 grid gap-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Link
                href={step.href}
                {...(step.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="card flex min-h-[4.5rem] items-center gap-4 px-4 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-text-soft"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {step.title}
                  </span>
                  <span className="block text-sm text-text-soft">
                    {step.hint}
                  </span>
                </span>
                <Icon
                  name="chevron-down"
                  weight="medium"
                  className="h-5 w-5 shrink-0 -rotate-90 text-text-soft"
                />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="your-business" className="grid gap-3">
        <SystemsGrid
          offers={more}
          empty={systems.length === 0}
          contactUrl={BUILDER_CONTACT_URL}
        >
          {systems.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="card flex h-full min-h-20 items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Icon name={s.icon} className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block h-5 truncate text-sm font-medium">
                    {s.title}
                  </span>
                  <span className="line-clamp-2 min-h-10 text-[13px] leading-5 text-text-soft">
                    {offerFor(s.id)?.line}
                  </span>
                  <SystemPoints points={offerFor(s.id)?.points} />
                </span>
              </Link>
            </li>
          ))}
        </SystemsGrid>
        {/* An owner has the "Message me" link above. The builder gets the button to add a system; an empty list keeps its own line. */}
        {(installHref || more.length === 0) && (
          <div>
            <AddSystemHint
              installHref={installHref}
              empty={systems.length === 0}
            />
          </div>
        )}
      </section>
    </div>
  );
}
