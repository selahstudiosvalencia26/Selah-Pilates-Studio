import { getBusiness } from "@/kit/business";
import { readEmailSettings } from "@/kit/emailSettings";
import EmailDetailsForm from "@/shell/email/EmailDetailsForm";

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const { senderName, replyTo, staffTo } = await readEmailSettings();
  return <EmailDetailsForm initial={{ senderName: senderName || getBusiness().name, replyTo, staffTo }} />;
}
