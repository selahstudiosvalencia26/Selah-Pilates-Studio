import {
  accountAuth,
  type ActivityItem,
  type SessionInfo,
} from "./accountAuth";

export type AccountStatus = {
  email: string;
  name: string;
  role: string;
  hasPassword: boolean;
  sessions: SessionInfo[];
  activity: ActivityItem[];
  avatarUrl: string | null;
};

// What the Account screen needs to know about the signed-in person. A plain server function (not an action), called from the
// page on the server. null means nobody is signed in, or sign-in is not connected yet.
export async function accountStatus(): Promise<AccountStatus | null> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  if (!person) return null;
  const [hasPassword, sessions, activity, avatarUrl] = await Promise.all([
    auth.hasPassword(person.id),
    auth.listSessions(person),
    auth.listActivity(person),
    auth.getAvatar(person.id),
  ]);
  return {
    email: person.email,
    name: person.name,
    role: person.role,
    hasPassword,
    sessions,
    activity,
    avatarUrl,
  };
}

/** The signed-in person's photo, for the menu and the People list. null when there is none, or nobody is signed in. */
export async function currentAvatar(): Promise<string | null> {
  const auth = accountAuth();
  const person = await auth.currentPerson();
  return person ? auth.getAvatar(person.id) : null;
}
