import { isEmailOn, readEmailSettings } from "@/kit/emailSettings";
import { canEmailCustomers, sendMail } from "@/kit/mailer";
import { customerWords } from "./notify";
import { readData, withData } from "./store";
import { addDays, localParts } from "./time";

// The day-before reminder. Run once each morning: every confirmed booking for tomorrow that has an email gets one, once. The booking's
// history remembers it, so running again sends nothing twice. Off until the switch for it is turned on.
export const REMINDED = "Reminder email sent";

export async function sendReminders(now: Date = new Date()): Promise<number> {
  const email = await readEmailSettings();
  if (!canEmailCustomers() || !isEmailOn(email, "booking", "reminder", false)) return 0;
  const { bookings, settings } = await readData();
  const tomorrow = addDays(localParts(now.toISOString(), settings.zone).date, 1);
  const due = bookings.filter((b) => b.deletedAt === null && b.status === "confirmed" && b.email && localParts(b.startsAt, settings.zone).date === tomorrow && !b.history.some((h) => h.what === REMINDED));
  let sent = 0;
  for (const b of due.slice(0, 100)) {
    if (!(await sendMail({ to: b.email, ...customerWords("reminder", b, settings) }, email)).ok) continue;
    sent++;
    await withData((data) => {
      data.bookings.find((x) => x.id === b.id)?.history.push({ at: now.toISOString(), what: REMINDED });
    });
  }
  return sent;
}
