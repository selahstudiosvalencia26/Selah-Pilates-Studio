// The top of a screen that has tabs: one calm title and one short line, then the tabs under it. The tabs name what is
// inside, so the pages under them do not repeat the name as a second big title. Hierarchy comes from weight, not size.
export default function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-semibold tracking-[-0.015em]">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-sm text-text-soft">{description}</p>}
    </header>
  );
}
