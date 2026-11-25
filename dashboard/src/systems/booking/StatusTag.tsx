import Icon from "@/kit/Icon";
import { statusWords } from "./rules";
import type { Booking } from "./schema";

// The state of a booking: always a word, with an icon, so colour is never the only signal.
export default function StatusTag({ booking }: { booking: Pick<Booking, "status" | "deposit" | "payBy"> }) {
  const waiting = booking.status === "requested";
  const tone = booking.status === "confirmed" || booking.status === "done" ? "text-success" : booking.status === "cancelled" ? "text-danger" : "text-warning";
  const icon = booking.status === "cancelled" ? "close" : waiting ? "bell" : "check";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${tone}`}>
      <Icon name={icon} className="h-4 w-4" weight="medium" />
      {statusWords(booking)}
    </span>
  );
}
