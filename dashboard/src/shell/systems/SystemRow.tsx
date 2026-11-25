import CopyButton from "@/kit/CopyButton";
import Icon from "@/kit/Icon";
import { gapsFor, servicesFor, type ServiceStatus } from "@/shell/services/services";
import Requirements from "./Requirements";
import { readMigrations } from "./files";
import type { Manifest } from "./manifest";

// One system on the Systems page (the builder's page). Two quiet lines: its name and version, and a little real detail.
// Open it for the only things you act on: its database files (copy them into Supabase) and the Switch off button.
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function SystemRow({ system: s, services = [] }: { system: Manifest; services?: ServiceStatus[] }) {
  const gaps = gapsFor(s, services);
  const files = readMigrations(s.id, s.migrations);
  const toWrite = files.filter((f) => f.sql === null).length;
  const detail = [count(s.permissions.length, "permission"), count(s.tables.length, "table"), ...(s.emails.length ? [count(s.emails.length, "email")] : []), ...(s.optional.length ? [`works with ${s.optional.join(" and ")}`] : [])].join(" · ");

  return (
    <li>
      <details className="group">
        <summary className="flex min-h-[4.5rem] list-none items-center gap-4 rounded-lg px-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <Icon name={s.icon} weight="medium" className="h-5 w-5 shrink-0 text-text-soft" />
          <span className="min-w-0 flex-1">
            <span className="block">
              <span className="text-[15px] font-medium">{s.name}</span>
              <span className="ml-2 text-[13px] text-text-soft">{s.version}</span>
            </span>
            <span className="block truncate text-[13px] text-text-soft">{detail}</span>
          </span>
          {gaps.length > 0 && <span className="hidden text-[13px] text-warning sm:inline">Needs {gaps.map((g) => g.name).join(" and ")}</span>}
          {toWrite > 0 && <span className="hidden text-[13px] text-warning sm:inline">Database files to write</span>}
          <span className="inline-flex items-center gap-2 text-[13px] text-text-soft">
            <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
            On
          </span>
          <Icon name="chevron-down" weight="medium" className="h-5 w-5 shrink-0 text-text-soft transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="grid gap-4 pb-5 pl-10 pr-1">
          <Requirements ids={servicesFor(s)} optional={s.optionalServices} status={services} />
          {files.length > 0 && <p className="text-[13px] font-medium text-text-soft">Database files</p>}
          <ul className="grid gap-2 empty:hidden">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-3">
                <span className="font-mono text-[13px]">{f.name}</span>
                {f.sql !== null ? <CopyButton text={f.sql} label="Copy SQL" /> : <span className="text-[13px] text-warning">Not written yet</span>}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <button type="button" aria-disabled="true" className="inline-flex h-11 cursor-not-allowed items-center rounded-lg border border-border px-3 text-[13px] font-medium text-text-soft">
              Switch off
            </button>
            <span className="text-[13px] text-text-soft">Hides it from the menu. Its data stays.</span>
          </div>
        </div>
      </details>
    </li>
  );
}
