import HoursForm from "@/systems/content/HoursForm";
import { readHours } from "@/systems/content/store";

export const dynamic = "force-dynamic";

export default async function OpeningHoursPage() {
  return <HoursForm initial={await readHours()} />;
}
