import { redirect } from "next/navigation";
import { readData } from "@/systems/booking/store";
import ClassesForm from "@/systems/content/ClassesForm";
import PublishBar from "@/systems/content/PublishBar";
import { SaveGroup } from "@/systems/content/SaveGroup";
import { readClasses, readPhotos } from "@/systems/content/store";

export const dynamic = "force-dynamic";

// The studio's classes: names, notes, prices and photos. They live with Bookings (decided 2026-11-25) and are no longer a Website tab.
// The screen itself still comes from the website editor, which knows how to save them to the website.
export default async function BookingClassListPage() {
  const [{ settings }, classes, photos] = await Promise.all([readData(), readClasses(), readPhotos()]);
  if (settings.mode !== "classes") redirect("/booking");
  return (
    <SaveGroup>
      {process.env.NODE_ENV === "production" && <PublishBar />}
      <ClassesForm initial={classes} photos={photos} />
    </SaveGroup>
  );
}
