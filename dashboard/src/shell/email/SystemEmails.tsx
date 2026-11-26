import { getBusiness } from "@/kit/business";
import { isEmailOn, readEmailSettings } from "@/kit/emailSettings";
import { ownDomain } from "@/kit/mailer";
import { loadSystems } from "@/shell/registry";
import EmailList from "./EmailList";

// The emails of every system, one card for each, built from the emails in their description files. A system with none says so, so
// it is clear nothing was forgotten.
export default async function SystemEmails() {
  const settings = await readEmailSettings();
  // Studio emails always can; customer emails need the studio's own domain. Reminders are not built.
  const canSend = (e: { to: string; id: string }) => e.id !== "reminder" && (e.to !== "customer" || ownDomain());
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
          rows={s.emails.map((e) => ({ id: e.id, label: e.label, when: e.when ?? "", to: e.to, required: e.required, sends: canSend(e), why: e.id === "reminder" ? "Reminders are not built yet" : "Needs your own web address", on: canSend(e) && (e.required || isEmailOn(settings, s.id, e.id, e.default)) }))}
        />
      ))}
    </div>
  );
}
