import { allowedEmails } from "@/lib/auth/config";
import { currentAvatar } from "@/shell/account/status";
import PeopleManager from "@/shell/people/PeopleManager";
import { loadSystems } from "@/shell/registry";

// People, for the owner and managers: who has an account, their roles, and what that lets them do in each system.
export default async function PeoplePage() {
  // Live: the real list of who can sign in. No sample people there.
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="grid gap-4">
        <p className="max-w-2xl text-sm text-text-soft">These emails can sign in, and each can do everything. To add or remove someone, ask the builder.</p>
        <ul className="grid gap-3">
          {allowedEmails().map((email) => (
            <li key={email} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
              <span className="min-w-0 break-words text-sm font-medium">{email}</span>
              <span className="shrink-0 text-xs text-text-soft">Owner</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const { systems } = loadSystems();
  return <PeopleManager systems={systems} avatarUrl={await currentAvatar()} />;
}
