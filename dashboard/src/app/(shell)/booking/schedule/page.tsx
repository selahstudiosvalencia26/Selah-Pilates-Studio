import { redirect } from "next/navigation";
import { readData } from "@/systems/booking/store";
import TimetableEditor from "@/systems/booking/TimetableEditor";
import { websiteClasses } from "@/systems/booking/websiteClasses";

export const dynamic = "force-dynamic";

export default async function BookingSchedulePage() {
  const [{ settings }, classes] = await Promise.all([readData(), websiteClasses()]);
  if (settings.mode !== "classes") redirect("/booking");
  return <TimetableEditor initial={settings.timetable} classes={classes} />;
}
