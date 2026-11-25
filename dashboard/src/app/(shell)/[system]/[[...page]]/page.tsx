import { notFound } from "next/navigation";
import { loadSystems } from "@/shell/registry";

// A section of a system that is installed but whose pages are not built yet. Once its own pages exist they take over
// this address. Any address a system declares shows here, so every section in the menu can be opened.
export default async function SystemPlaceholder({ params }: { params: Promise<{ system: string; page?: string[] }> }) {
  const { system, page = [] } = await params;
  const found = loadSystems().systems.find((s) => s.id === system);
  if (!found) notFound();

  const path = `/${[system, ...page].join("/")}`;
  const here = found.pages.find((p) => p.path === path);
  if (!here) notFound();

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.015em]">{here.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-soft">{found.name}. This page is not built yet.</p>
      </div>
      <p className="text-[13px] text-text-soft">Who can open it: {found.permissions.find((p) => p.id === here.permission)?.label ?? here.permission}.</p>
    </div>
  );
}
