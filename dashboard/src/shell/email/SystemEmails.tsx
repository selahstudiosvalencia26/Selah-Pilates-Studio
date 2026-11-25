import { getBusiness } from "@/kit/business";
import { isEmailOn, readEmailSettings } from "@/kit/emailSettings";
import { loadSystems } from "@/shell/registry";
import EmailList from "./EmailList";

// The Emails page of any system, built from the emails in its description file. A system adds it with one line:
//   <SystemEmails system="booking" />
export default async function SystemEmails({ system }: { system: string }) {
  const found = loadSystems().systems.find((s) => s.id === system);
  if (!found?.emails.length) return <p className="text-sm text-text-soft">This part of the dashboard sends no emails.</p>;
  const settings = await readEmailSettings();
  const rows = found.emails.map((e) => ({ id: e.id, label: e.label, when: e.when ?? "", to: e.to, required: e.required, on: e.required || isEmailOn(settings, system, e.id, e.default) }));
  return <EmailList system={system} rows={rows} from={settings.senderName || getBusiness().name} />;
}
