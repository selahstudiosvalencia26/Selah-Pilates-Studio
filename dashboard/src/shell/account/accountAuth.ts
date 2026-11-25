import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Everything the Account screen needs from the sign-in system, behind one small door. The actions (./actions.ts) only talk to
// this door, so the real version can replace the inside without touching the actions, the screen or the tests.
//
// THIS IS A PLACEHOLDER, like sign-in (../signin/actions.ts): it keeps one practice account in the server's memory so the
// screen can be tried, and it refuses to run in production (there is no signed-in person, so every action says "not
// connected"). The real version, written when Supabase Auth is connected, goes in `src/lib` (the only place that may import
// the database package) and does this:
//   currentPerson()      read the signed-in person from the session cookie, on the server.
//   verifyPassword()     a throwaway Supabase client calls signInWithPassword(email, password), so the person's real session is
//                        not touched. This is the "ask for the current password again" step before anything sensitive.
//   setPassword()        supabase.auth.updateUser({ password }). Supabase stores only a salted bcrypt hash. We store nothing.
//   endOtherSessions()   supabase.auth.signOut({ scope: "others" }): every device except this one is signed out.
//   listSessions()       the person's own rows from the sessions table (their device, browser and last use), never anyone else's.
//   endSession()         ends ONE session, only if it is the person's own (a typed id of someone else's does nothing).
//   getAvatar() / setAvatar() / clearAvatar()   the person's photo: a small WebP in private storage (the Files feature), shown
//                        through a short-lived link, and only to people in the same business. Never a public address.
//   record() / notify()  one line in the activity log (no secrets) and an email to the person: "Your password was changed".
// Passwords are never written to a log, an answer or an error, in the placeholder or in the real version.

export type Person = { id: string; email: string; name: string; role: string };

/** One place the person is signed in. `label` is plain words ("Chrome on Windows"), never an address or a token. */
export type SessionInfo = {
  id: string;
  label: string;
  lastActive: string;
  current: boolean;
};

export type AccountEventType =
  | "signin.code"
  | "signin.password"
  | "password.changed"
  | "password.set"
  | "password.failed"
  | "session.ended"
  | "sessions.ended"
  | "avatar.changed"
  | "avatar.removed";

/** One line of the person's own recent account activity, in plain words. Never holds a password, a code or an address. */
export type ActivityItem = { id: string; type: AccountEventType; at: string };

export type AccountEvent = {
  type: AccountEventType;
  personId: string;
  requestId: string;
  signedOutOthers?: boolean;
};

export type AccountAuth = {
  /** Who is signed in, as far as the server can tell. null means nobody (or sign-in is not connected). */
  currentPerson(): Promise<Person | null>;
  hasPassword(personId: string): Promise<boolean>;
  verifyPassword(person: Person, password: string): Promise<boolean>;
  /** For a person who has no password yet: the 6 number code that was emailed to them. */
  verifyCode(person: Person, code: string): Promise<boolean>;
  setPassword(person: Person, password: string): Promise<void>;
  /** Sign out every device except this one. */
  endOtherSessions(person: Person): Promise<void>;
  listSessions(person: Person): Promise<SessionInfo[]>;
  /** The person's own recent account activity, newest first. Only their own, never anyone else's. */
  listActivity(person: Person): Promise<ActivityItem[]>;
  /** End one device. false when it is not one of this person's own, or it is the device in use. */
  endSession(person: Person, sessionId: string): Promise<boolean>;
  /** The person's profile photo as a small WebP data address, or null. Already checked by ./avatar.ts before it gets here. */
  getAvatar(personId: string): Promise<string | null>;
  setAvatar(person: Person, dataUrl: string): Promise<void>;
  clearAvatar(person: Person): Promise<void>;
  record(event: AccountEvent): Promise<void>;
  /** Email the person. true only if an email really went out, so the screen never claims one that did not. */
  notify(person: Person, kind: "password-changed"): Promise<boolean>;
};

// ---- The practice account (development only) ----------------------------------------------------------------------------
// Practice sign-in (development only): username "admin" (or owner@example.com), password "password", code 123456.
// Never carry these into the real sign-in.
export const DEV_PERSON: Person = {
  id: "dev-owner",
  email: "owner@example.com",
  name: "Sample Owner",
  role: "Owner",
};
export const DEV_LOGIN = "admin";
export const DEV_PASSWORD = "password";
const DEV_CODE = "123456";

const hash = (password: string, salt: Buffer) =>
  scryptSync(password.normalize("NFKC"), salt, 32);
const sameHash = (password: string, saved: { salt: Buffer; key: Buffer }) =>
  timingSafeEqual(hash(password, saved.salt), saved.key);
const fresh = (password: string) => {
  const salt = randomBytes(16);
  return { salt, key: hash(password, salt) };
};

export type DevAccount = {
  saved: { salt: Buffer; key: Buffer } | null;
  events: AccountEvent[];
  notices: string[];
  otherSessionsEnded: number;
  sessions: SessionInfo[];
  activity: ActivityItem[];
  avatar: string | null;
};

// Sample devices so the list can be seen. The first is the one in use.
const sampleSessions = (): SessionInfo[] => {
  const ago = (minutes: number) =>
    new Date(Date.now() - minutes * 60_000).toISOString();
  return [
    { id: "s-this", label: "This browser", lastActive: ago(0), current: true },
    {
      id: "s-phone",
      label: "Safari on iPhone",
      lastActive: ago(95),
      current: false,
    },
    {
      id: "s-office",
      label: "Chrome on Windows",
      lastActive: ago(60 * 26),
      current: false,
    },
  ];
};
// Sample history so the list can be seen. The real list comes from the activity log (docs/dashboard/shell-plan.md, feature 10).
const sampleActivity = (): ActivityItem[] => {
  const ago = (minutes: number) =>
    new Date(Date.now() - minutes * 60_000).toISOString();
  return [
    { id: "a-1", type: "signin.code", at: ago(95) },
    { id: "a-2", type: "signin.code", at: ago(60 * 26) },
    { id: "a-3", type: "signin.code", at: ago(60 * 24 * 4) },
  ];
};
const blank = (withPassword: boolean): DevAccount => ({
  saved: withPassword ? fresh(DEV_PASSWORD) : null,
  events: [],
  notices: [],
  otherSessionsEnded: 0,
  sessions: sampleSessions(),
  activity: sampleActivity(),
  avatar: null,
});

// One practice account, kept while the server runs. `globalThis` so a reload of this file in development keeps it.
const store = globalThis as unknown as { __practiceAccount?: DevAccount };
export const devAccount = (): DevAccount => {
  const account = (store.__practiceAccount ??= blank(true));
  // An older copy kept alive by a reload in development may lack newer parts. Fill them in rather than crash.
  account.sessions ??= sampleSessions();
  account.activity ??= sampleActivity();
  account.avatar ??= null;
  return account;
};
/** For tests: back to a new practice account. */
export const resetDevAccount = (withPassword = true) => {
  store.__practiceAccount = blank(withPassword);
};

const practice: AccountAuth = {
  async currentPerson() {
    return DEV_PERSON;
  },
  async hasPassword() {
    return devAccount().saved !== null;
  },
  async verifyPassword(_person, password) {
    const saved = devAccount().saved;
    return saved !== null && sameHash(password, saved);
  },
  async verifyCode(_person, code) {
    return code === DEV_CODE;
  },
  async setPassword(_person, password) {
    devAccount().saved = fresh(password);
  },
  async endOtherSessions() {
    const account = devAccount();
    account.otherSessionsEnded += 1;
    account.sessions = account.sessions.filter((s) => s.current);
  },
  async listSessions() {
    return devAccount().sessions.map((s) => ({ ...s }));
  },
  async endSession(_person, sessionId) {
    const account = devAccount();
    const found = account.sessions.find((s) => s.id === sessionId);
    if (!found || found.current) return false;
    account.sessions = account.sessions.filter((s) => s.id !== sessionId);
    return true;
  },
  async getAvatar() {
    return devAccount().avatar;
  },
  async setAvatar(_person, dataUrl) {
    devAccount().avatar = dataUrl;
  },
  async clearAvatar() {
    devAccount().avatar = null;
  },
  async listActivity() {
    return devAccount()
      .activity.map((item, order) => ({ item, order }))
      .sort((a, b) => b.item.at.localeCompare(a.item.at) || b.order - a.order)
      .map((x) => x.item)
      .slice(0, 6);
  },
  async record(event) {
    const account = devAccount();
    account.events.push(event);
    account.activity.push({
      id: `a-${account.activity.length + 1}-${event.requestId}`,
      type: event.type,
      at: new Date().toISOString(),
    });
  },
  async notify(_person, kind) {
    devAccount().notices.push(kind); // recorded for the tests; no email service exists yet, so nothing is sent
    return false;
  },
};

// Nobody is signed in on a live site until real sign-in is connected, so every account action says "not connected".
const notConnected: AccountAuth = {
  async currentPerson() {
    return null;
  },
  hasPassword: async () => false,
  verifyPassword: async () => false,
  verifyCode: async () => false,
  setPassword: async () => {},
  endOtherSessions: async () => {},
  listSessions: async () => [],
  listActivity: async () => [],
  getAvatar: async () => null,
  setAvatar: async () => {},
  clearAvatar: async () => {},
  endSession: async () => false,
  record: async () => {},
  notify: async () => false,
};

export const accountAuth = (): AccountAuth =>
  process.env.NODE_ENV === "production" ? notConnected : practice;

/** Whether the practice password check is what answers (used by the password sign-in, ../signin/actions.ts). */
export const verifyPracticePassword = async (
  email: string,
  password: string,
): Promise<boolean> =>
  process.env.NODE_ENV !== "production" &&
  (email === DEV_LOGIN || email === DEV_PERSON.email) &&
  (await practice.verifyPassword(DEV_PERSON, password));
