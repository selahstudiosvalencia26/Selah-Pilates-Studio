import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import CopyButton from "@/kit/CopyButton";
import Icon from "@/kit/Icon";
import { SHELL_NEEDS, type ServiceStatus } from "@/shell/services/services";
import Requirements from "./Requirements";

// The dashboard itself on the Systems page, above the systems: what it needs, and its own database files.
// Its files are the numbered .sql files in supabase/migrations. Server only.
const FILE = /^\d{3}_[a-z0-9_]+\.sql$/;

function files() {
  const dir = join(process.cwd(), "supabase", "migrations");
  return existsSync(dir) ? readdirSync(dir).filter((n) => FILE.test(n)).sort().map((name) => ({ name, sql: readFileSync(join(dir, name), "utf8") })) : [];
}

export default function DashboardRow({ version, services }: { version: string; services: ServiceStatus[] }) {
  const sql = files();
  const gaps = services.filter((s) => (SHELL_NEEDS as readonly string[]).includes(s.id) && !s.connected);
  return (
    <li>
      <details className="group">
        <summary className="flex min-h-[4.5rem] list-none items-center gap-4 rounded-lg px-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <Icon name="settings" weight="medium" className="h-5 w-5 shrink-0 text-text-soft" />
          <span className="min-w-0 flex-1">
            <span className="block">
              <span className="text-[15px] font-medium">Dashboard</span>
              <span className="ml-2 text-[13px] text-text-soft">{version}</span>
            </span>
            <span className="block truncate text-[13px] text-text-soft">Sign in, people, menu and settings</span>
          </span>
          {gaps.length > 0 && <span className="hidden text-[13px] text-warning sm:inline">Needs {gaps.map((g) => g.name).join(" and ")}</span>}
          <span className="inline-flex items-center gap-2 text-[13px] text-text-soft">
            <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
            On
          </span>
          <Icon name="chevron-down" weight="medium" className="h-5 w-5 shrink-0 text-text-soft transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="grid gap-4 pb-5 pl-10 pr-1">
          <Requirements ids={SHELL_NEEDS} status={services} />
          <div className="grid gap-2">
            <p className="text-[13px] font-medium text-text-soft">Database files</p>
            {sql.length === 0 ? (
              <p className="text-[13px] text-text-soft">None yet. They come with real sign in.</p>
            ) : (
              <ul className="grid gap-2">
                {sql.map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[13px]">{f.name}</span>
                    <CopyButton text={f.sql} label="Copy SQL" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}
