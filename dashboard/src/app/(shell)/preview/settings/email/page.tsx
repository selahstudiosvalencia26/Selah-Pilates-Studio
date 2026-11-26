import { getBusiness } from "@/kit/business";
import { readEmailSettings } from "@/kit/emailSettings";
import { mailReady } from "@/kit/mailer";
import { currentUser } from "@/lib/auth/server";
import EmailDetailsForm from "@/shell/email/EmailDetailsForm";

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const [{ senderName, replyTo, staffTo }, person] = await Promise.all([readEmailSettings(), currentUser()]);
  return <EmailDetailsForm initial={{ senderName: senderName || getBusiness().name, replyTo, staffTo }} suggestion={person?.email} ready={mailReady()} />;
}
