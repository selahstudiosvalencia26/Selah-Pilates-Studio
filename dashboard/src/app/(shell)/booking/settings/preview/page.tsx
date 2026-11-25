import Switch from "@/systems/booking/Switch";
import { SETTING_VIEWS } from "@/systems/booking/views";
import { todayInZone } from "@/kit/time";
import ClassPicker from "@/systems/booking/ClassPicker";
import { readData } from "@/systems/booking/store";
import VenuePicker from "@/systems/booking/VenuePicker";

export const dynamic = "force-dynamic";

// What your customers see, built from the same public doors the website uses. Sending from here makes a real booking, so use a test name.
export default async function CustomerViewPage() {
  const { settings: s } = await readData();
  const today = todayInZone(s.zone);
  return (
    <>
      <Switch label="Settings view" items={SETTING_VIEWS} />
      <div className="grid gap-4">
        <p className="text-sm text-text-soft">This is the booking page your customers use. Anything sent from here is a real booking.</p>
        {s.mode === "classes" ? <ClassPicker today={today} zone={s.zone} /> : <VenuePicker today={today} maxGuests={s.maxGuests} />}
      </div>
    </>
  );
}
