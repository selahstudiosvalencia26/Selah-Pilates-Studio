import { redirect } from "next/navigation";

// The booking emails now sit with the studio email, in Settings.
export default function BookingEmailsPage() {
  redirect("/preview/settings/email");
}
