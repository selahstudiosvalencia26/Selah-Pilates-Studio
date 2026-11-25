import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import PageHeader from "@/shell/frame/PageHeader";
import SystemTabs from "@/shell/frame/SystemTabs";
import { sectionsOf } from "@/shell/menu";
import { loadSystems } from "@/shell/registry";
import PublishNote from "@/systems/content/PublishNote";

// Website: what the public site shows. The tabs are the pages listed in the system's description file. Sign-in is not built yet,
// so the sample owner stands in for the person.
export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const found = loadSystems().systems.find((s) => s.id === "content");
  const sections = found
    ? sectionsOf(found, permissionsOf([[EVERYTHING]]))
    : [];
  return (
    <>
      <PageHeader
        title="Website"
        description="Change the facts and words your website shows."
      />
      {found && sections.length > 1 && (
        <SystemTabs name={found.name} sections={sections} />
      )}
      <div className="sm:pt-5">
        {process.env.NODE_ENV === "production" && <PublishNote />}
        {children}
      </div>
    </>
  );
}
