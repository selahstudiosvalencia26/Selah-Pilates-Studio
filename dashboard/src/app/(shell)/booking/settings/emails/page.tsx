import Switch from "@/systems/booking/Switch";
import { SETTING_VIEWS } from "@/systems/booking/views";
import SystemEmails from "@/shell/email/SystemEmails";

export const dynamic = "force-dynamic";

export default function BookingEmailsPage() {
  return (
    <>
      <Switch label="Settings view" items={SETTING_VIEWS} />
      {/* Customer emails need the studio's own web address before they can be sent, so this says so plainly. */}
      <p role="note" className="card mb-4 p-4 text-sm text-text-soft">
        Only the studio alert, New booking request, is sent right now. Emails to customers are not sent yet.
      </p>
      <SystemEmails system="booking" />
    </>
  );
}
