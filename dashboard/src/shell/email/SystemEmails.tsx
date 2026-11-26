import { getBusiness } from "@/kit/business";
import { isEmailOn, readEmailSettings } from "@/kit/emailSettings";
import { canEmailCustomers } from "@/kit/mailer";
import { loadSystems } from "@/shell/registry";
import EmailList from "./EmailList";

// The emails of every system, one card for each, built from the emails in their description files. A system with none says so, so
// it is clear nothing was forgotten.
export default async function SystemEmails() {
  const settings = await readEmailSettings();
  // Studio emails always can; customer emails need Gmail or a domain; reminders also need the daily run.
  const morning = Boolean((process.env.CRON_SECRET ?? "").trim()); // the daily run that sends reminders
  const canSend = (e: { to: string; id: string }) => (e.to !== "customer" || canEmailCustomers()) && (e.id !== "reminder" || morning);
  const systems = [...loadSystems().systems].sort((a, b) => b.emails.length - a.emails.length);
  return (
    <div className="grid gap-4">
      {systems.map((s) => (
        <EmailList
          key={s.id}
          system={s.id}
          title={s.name}
          icon={s.icon}
          from={settings.senderName || getBusiness().name}
          rows={s.emails.map((e) => ({ id: e.id, label: e.label, when: e.when ?? "", to: e.to, required: e.required, sends: canSend(e), why: e.id === "reminder" && canEmailCustomers() ? "Needs the daily run (CRON_SECRET)" : "Connect Gmail to email customers", on: canSend(e) && (e.required || isEmailOn(settings, s.id, e.id, e.default)) }))}
        />
      ))}
    </div>
  );
}
