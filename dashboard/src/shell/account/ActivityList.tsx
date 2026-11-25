import type { AccountEventType, ActivityItem } from "./accountAuth";
import { formatInZone } from "@/kit/time";

// The person's own recent account activity, in plain words, newest first. Only what is useful to notice: a sign in or a change
// they did not make is the sign of a problem. Nothing secret is ever in an item (see accountAuth.ts).
const WORDS: Record<AccountEventType, string> = {
  "signin.code": "You signed in with an emailed code",
  "signin.password": "You signed in with your password",
  "password.changed": "You changed your password",
  "password.set": "You added a password",
  "password.failed": "A wrong current password was tried",
  "session.ended": "You signed out a device",
  "sessions.ended": "You signed out all other devices",
  "avatar.changed": "You changed your photo",
  "avatar.removed": "You removed your photo",
};

export default function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-text-soft">
        Nothing yet. Sign-ins and changes to your account will show here.
      </p>
    );
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex min-h-12 items-center justify-between gap-4 py-2 text-sm"
        >
          <span
            className={
              item.type === "password.failed" ? "font-medium text-danger" : ""
            }
          >
            {WORDS[item.type]}
          </span>
          <time
            dateTime={item.at}
            className="shrink-0 text-[13px] text-text-soft"
          >
            {formatInZone(item.at)}
          </time>
        </li>
      ))}
    </ul>
  );
}
