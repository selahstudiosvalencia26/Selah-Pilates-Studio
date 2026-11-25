import { notFound } from "next/navigation";
import CopyButton from "@/kit/CopyButton";
import Icon from "@/kit/Icon";
import { loadSystems, SHELL_VERSION } from "@/shell/registry";
import { checkServices } from "@/shell/services/services";
import { notAdded, type Offer } from "@/shell/systems/catalogue";
import SystemRow from "@/shell/systems/SystemRow";
import DashboardRow from "@/shell/systems/DashboardRow";
import { todayInZone } from "@/kit/time";
import { domainState } from "@/shell/usage/domain";
import { readDomain } from "@/shell/usage/store";
import UsagePanel from "@/shell/usage/UsagePanel";
import { isOwner } from "@/shell/systems/owner";
import { isMaster } from "@/shell/systems/master";

// The Systems page, for you (the builder) only. Balanced: what is installed with a little real detail, what you can add
// with its command ready to copy, and the three steps in a quiet column. How a system is added, updated, switched off or
// removed is written in docs/architecture/system-design.md.
const STEPS = [
  { lead: "Add", text: "Copy a command below, run it, then push the new folder to GitHub. It shows up here. Copy its database files into Supabase." },
  { lead: "Update", text: "A new version arrives on the client's GitHub. Approve it. New database files show here with a Copy button." },
  { lead: "Remove", text: "Switch it off. It disappears from the menu and its data stays until you delete it on purpose." },
];

function OfferRow({ offer }: { offer: Offer }) {
  return (
    <li className="flex min-h-16 items-center gap-4 px-1 py-2">
      <Icon name={offer.icon} weight="medium" className="h-5 w-5 shrink-0 text-text-soft" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{offer.name}</span>
        <span className="block text-[13px] text-text-soft">{offer.line}</span>
      </span>
      <CopyButton text={`npm run new-system ${offer.id}`} label="Copy command" className="shrink-0" />
    </li>
  );
}

export default async function SystemsPage() {
  // For the owner only. Anyone else who types the address finds nothing.
  if (!(await isOwner())) notFound();
  const { systems, failed } = loadSystems();
  const services = checkServices(systems);
  const domain = await readDomain();
  const master = isMaster(); // only the master offers systems to add
  const more = master ? notAdded(systems.map((s) => s.id)) : [];
  const first = more.filter((o) => o.group === "first");
  const asked = more.filter((o) => o.group === "asked");

  return (
    <div className={`grid gap-12 ${master ? "lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16" : ""}`}>
      <div className="grid content-start gap-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.015em]">Systems</h1>
          <p className="mt-1 text-text-soft">
            Dashboard version {SHELL_VERSION} · {systems.length} on{failed.length ? `, ${failed.length} off` : ", all passed the check"}
          </p>
        </div>

        <section aria-labelledby="connections" className="grid gap-2">
          <h2 id="connections" className="text-sm font-medium text-text-soft">
            Connections
          </h2>
          <ul className="divide-y divide-border">
            {services.map((c) => (
              <li key={c.id} className="flex min-h-16 items-center gap-4 px-1 py-2">
                <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${c.connected ? "bg-success" : c.optional ? "bg-border-strong" : "bg-warning"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{c.name}</span>
                  <span className="block text-[13px] text-text-soft">
                    {c.why} · used by {c.neededBy.join(", ")}
                  </span>
                  {!c.connected && <span className={`block font-mono text-[13px] ${c.optional ? "text-text-soft" : "text-warning"}`}>{c.optional ? "To turn it on, add" : "Add"} {process.env.NODE_ENV === "production" ? "in Vercel" : "to .env.local"}: {c.missing.join(", ")}</span>}
                </span>
                <span className="text-[13px] text-text-soft">{c.connected ? "Connected" : c.optional ? "Optional" : "Not connected"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="usage" className="grid gap-2">
          <h2 id="usage" className="text-sm font-medium text-text-soft">
            What can run out
          </h2>
          <UsagePanel domain={domain} state={domainState(domain.renewsOn, todayInZone("Asia/Manila"))} emailReady={!!services.find((c) => c.id === "resend")?.connected} databaseReady={!!services.find((c) => c.id === "supabase")?.connected} />
        </section>

        <section aria-labelledby="installed" className="grid gap-2">
          <h2 id="installed" className="text-sm font-medium text-text-soft">
            Installed
          </h2>
          {!master && <p className="text-sm text-text-soft">Open a system, then copy each database file into Supabase&rsquo;s SQL editor, in number order.</p>}
          <ul className="divide-y divide-border">
            <DashboardRow version={SHELL_VERSION} services={services} />
            {systems.map((s) => (
              <SystemRow key={s.id} system={s} services={services} />
            ))}
            {failed.map((f) => (
              <li key={f.folder} className="py-4">
                <p className="flex items-center gap-3 px-1 text-[15px] font-medium">
                  <Icon name="warning" weight="medium" className="h-5 w-5 shrink-0 text-danger" />
                  {f.folder}
                  <span className="text-[13px] font-normal text-text-soft">Off</span>
                </p>
                <ul className="mt-2 list-disc pl-11 text-[13px] text-text-soft">
                  {f.problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {more.length > 0 && (
          <section aria-labelledby="ready" className="grid gap-8">
            <h2 id="ready" className="sr-only">
              Ready to add
            </h2>
            {[
              { title: "Most clients start with", items: first },
              { title: "When a client asks", items: asked },
            ]
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div key={g.title} className="grid gap-2">
                  <h3 className="text-sm font-medium text-text-soft">{g.title}</h3>
                  <ul className="divide-y divide-border">
                    {g.items.map((o) => (
                      <OfferRow key={o.id} offer={o} />
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        )}
      </div>

      {master && <aside aria-label="How it works" className="grid content-start gap-4 lg:sticky lg:top-10">
        <h2 className="text-sm font-medium text-text-soft">Adding, updating, removing</h2>
        <ol className="grid gap-5 border-l border-border pl-5">
          {STEPS.map((s) => (
            <li key={s.lead} className="grid gap-1">
              <span className="text-sm font-medium">{s.lead}</span>
              <span className="text-[13px] leading-relaxed text-text-soft">{s.text}</span>
            </li>
          ))}
        </ol>
      </aside>}
    </div>
  );
}
