import { SERVICE_HELP, type ServiceStatus } from "@/shell/services/services";

// What a part of the dashboard needs to work: why, what happens without it, where to get it, and each setting still
// missing from .env.local, by NAME only. Never a value.
export default function Requirements({ ids, status, optional = [] }: { ids: readonly string[]; status: ServiceStatus[]; optional?: readonly string[] }) {
  const rows = [...ids, ...optional.filter((id) => !ids.includes(id))].flatMap((id) => {
    const found = status.find((s) => s.id === id);
    return found ? [{ ...found, extra: !ids.includes(id) }] : [];
  });
  return (
    <div className="grid gap-2">
      <p className="text-[13px] font-medium text-text-soft">What it needs</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-text-soft">Nothing extra.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => {
            const help = SERVICE_HELP[r.id];
            return (
              <li key={r.id} className="grid gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-sm font-semibold">
                    {r.name}
                    {r.extra && <span className="ml-2 font-normal text-text-soft">Optional</span>}
                  </h3>
                  <span className={`text-[13px] ${r.connected ? "text-success" : r.extra ? "text-text-soft" : "text-warning"}`}>{r.connected ? "Connected" : "Not connected"}</span>
                </div>
                <p className="text-sm">{help.why}</p>
                {!r.connected && (
                  <>
                    <p className="text-[13px] text-text-soft">
                      <span className="font-medium text-text">Without it:</span> {help.without}
                    </p>
                    <p className="text-[13px] text-text-soft">
                      <span className="font-medium text-text">Where to get it:</span> {help.where}. Then add these to .env.local, or to your host&rsquo;s environment variables.
                    </p>
                    <ul className="grid gap-1.5 border-t border-border pt-3">
                      {r.missing.map((name) => (
                        <li key={name} className="grid gap-x-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
                          <span className="break-all font-mono text-[12px]">{name}</span>
                          <span className="text-[13px] text-text-soft">{help.vars[name]}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
