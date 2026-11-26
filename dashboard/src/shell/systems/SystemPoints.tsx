// The few things a system does, as quiet labels under its one line.
export default function SystemPoints({ points }: { points?: string[] }) {
  if (!points?.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5 sm:flex-nowrap sm:overflow-hidden">
      {points.map((p) => (
        <span key={p} className="min-w-0 rounded-md bg-surface px-2 py-0.5 text-xs text-text-soft sm:truncate">
          {p}
        </span>
      ))}
    </span>
  );
}
