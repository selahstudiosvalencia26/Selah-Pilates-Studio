import { createClient } from "@supabase/supabase-js";

// The database, from the server only. It uses the secret key, which can read and write everything, so nothing in this file may
// ever run in the browser, and every caller checks who is asking first.

const settings = () => {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return url && key ? { url, key } : null;
};

export const databaseOn = (): boolean => settings() !== null;

function client() {
  const s = settings();
  if (!s) throw new Error("The database is not set up.");
  return createClient(s.url, s.key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// The error is logged by name only: a database message can quote a customer's details back.
function check(error: { code?: string } | null, doing: string) {
  if (error) throw new Error(`Database ${doing} failed (${error.code ?? "unknown"}).`);
}

const PAGE = 1000; // the most Supabase sends at once

/** Every row of a table, in pages. */
export async function selectAll(table: string, orderBy: string): Promise<Record<string, unknown>[]> {
  const db = client();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select("*").order(orderBy).range(from, from + PAGE - 1);
    check(error, "read");
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < PAGE) return rows;
  }
}

/** The one row of a one-row table, or null. */
export async function selectOne(table: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await client().from(table).select("*").limit(1).maybeSingle();
  check(error, "read");
  return (data as Record<string, unknown> | null) ?? null;
}

export async function callFunction<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().rpc(name, args);
  check(error, "write");
  return data as T;
}
