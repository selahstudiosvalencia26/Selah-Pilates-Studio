import { z } from "zod";
import { ROLE_NAMES } from "@/kit/permissions";
import { SERVICE_IDS } from "@/shell/services/services";

// The description file every system has (docs/architecture/system-design.md, section 2). The shell reads it and nothing else leaks out
// of the system. Strict on purpose: an unknown key is a mistake, not a feature.

const systemId = z.string().regex(/^[a-z]{2,20}$/, "must be one lowercase word, 2 to 20 letters");
const itemId = z.string().regex(/^[a-z][a-z-]{1,40}$/, "must be lowercase words joined by dashes");
const version = z.string().regex(/^\d+\.\d+\.\d+$/, "must look like 1.2.3");

const page = z.strictObject({
  path: z.string().regex(/^\/[a-z][a-z0-9/[\]-]*$/, "must be a lowercase address like /booking or /booking/[id]"),
  title: z.string().min(1).max(40),
  permission: z.string(),
  nav: z.boolean().default(false), // a section of the system, shown in its own sub-menu (tabs on a phone)
});

const permission = z.strictObject({
  id: z.string(),
  label: z.string().min(1).max(60),
  default: z.array(z.enum(ROLE_NAMES)).default([]),
});

export const manifestSchema = z.strictObject({
  id: systemId,
  name: z.string().min(1).max(40),
  version,
  requires_shell: z.string().min(1).max(40),
  icon: z.string().regex(/^[a-z-]{2,20}$/),
  needs: z.array(z.string()).default([]),
  services: z.array(z.enum(SERVICE_IDS)).default([]), // outside services it needs (Supabase, Resend...), checked on the Systems page
  optionalServices: z.array(z.enum(SERVICE_IDS)).default([]), // services it can use but works without (PayMongo)
  optional: z.array(systemId).default([]),
  pages: z.array(page).min(1).max(20),
  permissions: z.array(permission).min(1).max(30),
  tables: z.array(z.string()).default([]),
  migrations: z.array(z.string()).default([]),
  labels: z.record(z.string(), z.string()).default({}),
  today: z.array(z.strictObject({ id: itemId, title: z.string().min(1).max(60), permission: z.string() })).max(5).default([]),
  emails: z.array(z.strictObject({ id: itemId, label: z.string().min(1).max(80), when: z.string().max(120).optional(), to: z.enum(["customer", "staff", "owner"]), required: z.boolean(), default: z.boolean() })).default([]),
  public: z.array(z.strictObject({ id: itemId, method: z.enum(["GET", "POST"]), fields: z.array(z.string()).default([]) })).default([]),
  search: z.strictObject({ table: z.string(), fields: z.array(z.string()).min(1), permission: z.string() }).optional(),
  provides: z.array(z.string()).default([]),
});

// What an author writes (defaults optional) and what the shell reads (defaults filled in).
export type ManifestInput = z.input<typeof manifestSchema>;
export type Manifest = z.output<typeof manifestSchema>;

// Writing a description file with the right shape, checked by the editor as you type.
export const defineSystem = (m: ManifestInput): ManifestInput => m;

// Services the shell itself offers, which a system may say it needs.
export const SHELL_SERVICES = ["files", "email", "search", "today"] as const;
