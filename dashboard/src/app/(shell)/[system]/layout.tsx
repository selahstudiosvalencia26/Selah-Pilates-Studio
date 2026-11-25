import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import SystemTabs from "@/shell/frame/SystemTabs";
import { sectionsOf } from "@/shell/menu";
import { loadSystems } from "@/shell/registry";

// Around every page of a system: its pages as tabs along the top. Sign-in is
// not built yet, so the sample owner stands in for the person; later their real permissions decide what is listed.
export default async function SystemLayout({ children, params }: { children: React.ReactNode; params: Promise<{ system: string }> }) {
  const { system } = await params;
  const found = loadSystems().systems.find((s) => s.id === system);
  const sections = found ? sectionsOf(found, permissionsOf([[EVERYTHING]])) : [];
  return (
    <>
      {found && sections.length > 1 && <SystemTabs name={found.name} sections={sections} />}
      {children}
    </>
  );
}
