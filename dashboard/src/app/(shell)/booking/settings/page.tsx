import Switch from "@/systems/booking/Switch";
import { SETTING_VIEWS } from "@/systems/booking/views";
import SettingsForm from "@/systems/booking/SettingsForm";
import { readData } from "@/systems/booking/store";

export const dynamic = "force-dynamic";

export default async function BookingSettingsPage() {
  return (
    <>
      <Switch label="Settings view" items={SETTING_VIEWS} />
      <SettingsForm initial={(await readData()).settings} />
    </>
  );
}
