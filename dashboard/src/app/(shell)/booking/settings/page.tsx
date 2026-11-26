import Link from "next/link";
import { buttonClass } from "@/kit/Button";
import SettingsForm from "@/systems/booking/SettingsForm";
import { readData } from "@/systems/booking/store";

export const dynamic = "force-dynamic";

export default async function BookingSettingsPage() {
  return (
    <>
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        {/* The emails live in the dashboard's own Settings, with the studio email. */}
        <Link href="/preview/settings/email" className={buttonClass()}>
          Email settings
        </Link>
        <Link href="/booking/settings/preview" className={buttonClass()}>
          See what customers see
        </Link>
      </div>
      <SettingsForm initial={(await readData()).settings} />
    </>
  );
}
