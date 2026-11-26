import { permissionsOf } from "@/kit/permissions";
import { myPermissions } from "@/kit/session";
import PageHeader from "@/shell/frame/PageHeader";
import SystemTabs from "@/shell/frame/SystemTabs";
import { sectionsOf } from "@/shell/menu";
import { loadSystems } from "@/shell/registry";
import { readData } from "@/systems/booking/store";

// Bookings: the tabs are the pages listed in the system's description file. Sign-in is not built yet, so the sample owner stands in for the person.
export default async function BookingLayout({ children }: { children: React.ReactNode }) {
  const found = loadSystems().systems.find((s) => s.id === "booking");
  const { settings } = await readData();
  // A venue has no weekly classes, so it never shows that tab.
  const sections = (found ? sectionsOf(found, permissionsOf([await myPermissions()])) : []).filter((s) => settings.mode === "classes" || !["/booking/classes", "/booking/schedule"].includes(s.href));
  return (
    <>
      <PageHeader title="Bookings" description={settings.mode === "classes" ? "Who is booked into your classes." : "Requests, dates and deposits for your venue."} />
      {found && sections.length > 1 && <SystemTabs name={found.name} sections={sections} />}
      <div className="sm:pt-5">{children}</div>
    </>
  );
}
