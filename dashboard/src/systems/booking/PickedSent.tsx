import { peso } from "./pricing";
import { btn, card } from "./ui";

// The last step a customer sees: what they asked for and, when the deposit is asked at once, how to pay it.
export type Pay = { amount: number; payBy: string | null; accounts: { label: string; name: string; number: string; qr: string }[] };

type Props = { summary: string; pay: Pay | null; depositWords: string; again: () => void; spot?: boolean };

export default function PickedSent({ summary, pay, depositWords, again, spot = false }: Props) {
  const due = pay?.payBy ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(pay.payBy)) : "";
  return (
    <div role="status" className={`${card} grid justify-items-start gap-4 p-5 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none`}>
      <h3 className="text-lg font-semibold">{pay ? `Pay ${peso(pay.amount)} to hold your ${spot ? "slot" : "date"}.` : "We got your request."}</h3>
      <p className="text-sm">
        {summary}. It is not booked yet. {pay ? `${due ? `Pay before ${due}. ` : ""}Your ${spot ? "slot" : "date"} is ${spot ? "confirmed" : "locked"} once we receive your payment and confirm.` : `We will reply to confirm.${depositWords && ` ${depositWords}`}`}
      </p>
      {pay && (
        <>
          {pay.accounts.length === 0 && <p className="text-sm">We will send you how to pay.</p>}
          <ul className={`grid w-full gap-4 empty:hidden ${pay.accounts.length > 1 ? "xl:grid-cols-2" : ""}`}>
            {pay.accounts.map((a) => (
              <li key={`${a.label}-${a.number}`} className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border p-5 max-sm:flex-col max-sm:justify-center max-sm:text-center">
                <div className="grid gap-1 max-sm:justify-items-center">
                  <p className="text-xs text-text-soft">{a.label}</p>
                  {a.number && <p className="text-2xl font-semibold tabular-nums">{a.number}</p>}
                  <p className="text-sm">{a.name}</p>
                </div>
                {a.qr && (
                  // eslint-disable-next-line @next/next/no-img-element -- the owner's own picture, sent with the answer
                  <img src={a.qr} alt={`${a.label} QR code`} className="h-52 w-52 max-w-full object-contain" />
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm">Then send us a screenshot of your payment.</p>
        </>
      )}
      <button type="button" className={btn} onClick={again}>
        {spot ? "Book another class" : "Ask about another date"}
      </button>
    </div>
  );
}
