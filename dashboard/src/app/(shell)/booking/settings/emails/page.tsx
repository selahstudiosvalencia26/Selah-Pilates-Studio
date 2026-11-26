import Switch from "@/systems/booking/Switch";
import { SETTING_VIEWS } from "@/systems/booking/views";
import SystemEmails from "@/shell/email/SystemEmails";

export const dynamic = "force-dynamic";

export default function BookingEmailsPage() {
  return (
    <>
      <Switch label="Settings view" items={SETTING_VIEWS} />
      <SystemEmails system="booking" />
    </>
  );
}
