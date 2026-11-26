import Link from "next/link";
import CopyButton from "@/kit/CopyButton";
import { payLabel, type PayAccount } from "./schema";
import { card, link } from "./ui";

// Shown on a booking that is waiting for its deposit: the message to send the customer and the QR pictures. Email is not
// connected yet, so staff send it themselves by Messenger or text.
export default function PaymentRequest({ message, accounts }: { message: string; accounts: PayAccount[] }) {
  if (accounts.length === 0)
    return (
      <p className={`${card} p-4 text-sm`}>
        To send payment details, first add a way to pay in{" "}
        <Link href="/booking/settings" className={link}>
          booking settings
        </Link>
        .
      </p>
    );
  const withQr = accounts.filter((a) => a.qr);
  return (
    <div className="grid justify-items-start gap-3">
      <p className="max-w-2xl whitespace-pre-line text-sm">{message}</p>
      <CopyButton text={message} label="Copy message" />
      {withQr.length > 0 && (
        <ul className="flex flex-wrap gap-4">
          {withQr.map((a) => (
            <li key={a.id} className="grid justify-items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- the owner's own picture, held as data */}
              <img src={a.qr} alt={`${payLabel(a)} QR code`} className="h-40 w-40 rounded-lg border border-border object-contain" />
              <a href={a.qr} download={`${payLabel(a)}-qr.${a.qr.startsWith("data:image/jpeg") ? "jpg" : "png"}`} className={link}>
                Save {payLabel(a)} QR
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
