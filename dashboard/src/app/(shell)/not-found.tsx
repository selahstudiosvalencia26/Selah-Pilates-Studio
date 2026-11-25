import Link from "next/link";

// Shown inside the dashboard (menu and frame stay) when a page does not exist. In plain words, readable in light and dark, with a
// way back. Without this the browser's default page shows, whose words are nearly invisible on the dashboard's colours.
export default function ShellNotFound() {
  return (
    <div className="grid max-w-md gap-3 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        That page is not here
      </h1>
      <p className="text-sm text-text-soft">
        The link may be old, or the page may have moved. Pick a page from the
        menu, or go back to Today.
      </p>
      <div>
        <Link
          href="/preview"
          className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-accent-contrast transition-[opacity,transform] duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
        >
          Go to Today
        </Link>
      </div>
    </div>
  );
}
