import Link from "next/link";
import { buttonClass } from "@/kit/Button";
import SettingsForm from "@/systems/booking/SettingsForm";
import { readData } from "@/systems/booking/store";

export const dynamic = "force-dynamic";

export default async function BookingSettingsPage() {
  return (
    <>
      <div className="mb-5 flex justify-end">
        <Link href="/booking/settings/preview" className={buttonClass()}>
          See what customers see
        </Link>
      </div>
      <SettingsForm initial={(await readData()).settings} />
    </>
  );
}
