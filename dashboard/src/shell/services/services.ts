import type { Manifest } from "@/shell/systems/manifest";

// The outside services the dashboard can use, and which settings (in .env.local) each one needs to work.
// A system lists the ones it needs in its description file (`services`). The shell always needs "supabase" (the database and
// sign in) and "resend" (the sign-in code). A system that sends email needs "resend", and one with tables needs "supabase".
// This only checks that the settings are filled in. It never reads a value out loud, never logs one and never sends one to
// the browser: only the NAMES of missing settings are ever shown.

export const SERVICES = {
  supabase: { name: "Supabase", why: "The database and sign in", vars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] },
  resend: { name: "Resend", why: "Sending email, like sign-in codes", vars: ["RESEND_API_KEY", "EMAIL_FROM"] },
  paymongo: { name: "PayMongo", why: "Customers pay online and it is checked by itself", vars: ["PAYMONGO_SECRET_KEY", "PAYMONGO_WEBHOOK_SECRET"] },
  jobs: { name: "Scheduled jobs", why: "Backups and reminders that run by themselves", vars: ["JOBS_SECRET"] },
} as const;

export type ServiceId = keyof typeof SERVICES;
export const SERVICE_IDS = Object.keys(SERVICES) as [ServiceId, ...ServiceId[]];

// The longer, plain explanation shown when a part is opened on the Systems page: why we need it, what happens without it,
// where to find the settings, and what each one is.
export const SERVICE_HELP: Record<ServiceId, { why: string; without: string; where: string; vars: Record<string, string> }> = {
  supabase: {
    why: "Keeps your bookings, people and settings online, and checks who is signing in.",
    without: "The dashboard cannot go live. Everything is saved only on this computer.",
    where: "supabase.com, your project, Project Settings, API",
    vars: {
      NEXT_PUBLIC_SUPABASE_URL: "Your project's address",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "The public key the browser uses",
      SUPABASE_SERVICE_ROLE_KEY: "The secret key for the server. It opens everything, so never share it",
    },
  },
  resend: {
    why: "Sends your emails: sign in codes, booking confirmations and alerts to staff.",
    without: "No email is sent. You have to message customers yourself.",
    where: "resend.com, API Keys",
    vars: { RESEND_API_KEY: "The secret key that lets the dashboard send", EMAIL_FROM: "The address your emails come from" },
  },
  paymongo: {
    why: "Lets customers pay online, and marks the payment as paid by itself.",
    without: "Customers pay by GCash or bank, and you check it and mark it paid.",
    where: "dashboard.paymongo.com, Developers",
    vars: { PAYMONGO_SECRET_KEY: "The secret key that creates payments", PAYMONGO_WEBHOOK_SECRET: "Proves a paid notice really came from PayMongo" },
  },
  jobs: {
    why: "Runs backups and reminders on a schedule, without anyone pressing a button.",
    without: "Backups and reminders do not happen by themselves.",
    where: "You make it up: any long random text",
    vars: { JOBS_SECRET: "Stops strangers from starting the jobs" },
  },
};

export type ServiceStatus = { id: ServiceId; name: string; why: string; connected: boolean; missing: string[]; neededBy: string[]; optional: boolean };

type Needs = Pick<Manifest, "services" | "emails" | "tables"> & Partial<Pick<Manifest, "optionalServices">>;

// What the shell itself needs, before any system is added.
export const SHELL_NEEDS: readonly ServiceId[] = ["supabase", "resend"];

// Which services one system needs: what it lists, plus email if it sends any, plus the database if it has tables.
export function servicesFor(system: Needs): ServiceId[] {
  const need = new Set<ServiceId>(system.services);
  if (system.emails.length > 0) need.add("resend");
  if (system.tables.length > 0) need.add("supabase");
  return [...need];
}

const filled = (value: string | undefined) => typeof value === "string" && value.trim() !== "";

// Check every service the shell and the installed systems need. A service nobody needs is left out.
export function checkServices(systems: (Needs & Pick<Manifest, "name">)[], env: Record<string, string | undefined> = process.env): ServiceStatus[] {
  const users = new Map<ServiceId, string[]>();
  const add = (id: ServiceId, who: string) => users.set(id, [...(users.get(id) ?? []), who]);
  for (const id of SHELL_NEEDS) add(id, "Dashboard");
  for (const s of systems) for (const id of servicesFor(s)) add(id, s.name);
  const required = new Set(users.keys());
  // A service a system can use but works without. It is listed so it can be switched on, never as a problem.
  for (const s of systems) for (const id of s.optionalServices ?? []) if (!required.has(id)) add(id, s.name);

  return SERVICE_IDS.filter((id) => users.has(id)).map((id) => {
    const missing = SERVICES[id].vars.filter((v) => !filled(env[v]));
    return { id, name: SERVICES[id].name, why: SERVICES[id].why, connected: missing.length === 0, missing, neededBy: users.get(id) ?? [], optional: !required.has(id) };
  });
}

// The services one system needs that are not connected, so its row can say so in plain words.
export const gapsFor = (system: Needs, status: ServiceStatus[]): ServiceStatus[] => {
  const need = servicesFor(system);
  return status.filter((s) => need.includes(s.id) && !s.connected);
};
