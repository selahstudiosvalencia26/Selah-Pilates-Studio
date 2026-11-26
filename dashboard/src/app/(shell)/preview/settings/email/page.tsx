import { getBusiness } from "@/kit/business";
import { readEmailSettings } from "@/kit/emailSettings";
import { lastEmail, mailReady } from "@/kit/mailer";
import { currentUser } from "@/lib/auth/server";
import EmailDetailsForm from "@/shell/email/EmailDetailsForm";
import SystemEmails from "@/shell/email/SystemEmails";
import SampleEmails from "@/systems/booking/SampleEmails";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export default async function EmailSettingsPage() {
  const [{ senderName, replyTo, staffTo }, person, last] = await Promise.all([readEmailSettings(), currentUser(), lastEmail()]);
  return (
    <EmailDetailsForm initial={{ senderName: senderName || getBusiness().name, replyTo, staffTo }} suggestion={person?.email} ready={mailReady()}>
      {last && (
        <p role="status" className={`card mb-4 p-4 text-sm ${last.ok ? "text-text-soft" : "!border-danger text-danger"}`}>
          {last.ok ? "Last email sent" : "Last email was not sent"} {when(last.at)} to {last.to}.{!last.ok && ` Reason from the email service: ${last.why}`}
        </p>
      )}
      {mailReady() && <SampleEmails start={replyTo} />}
      <SystemEmails />
    </EmailDetailsForm>
  );
}
