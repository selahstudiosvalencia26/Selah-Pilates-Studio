import { redirect } from "next/navigation";

// The class list moved to Bookings. An old link goes there.
export default function OldClassListPage() {
  redirect("/booking/classes");
}
