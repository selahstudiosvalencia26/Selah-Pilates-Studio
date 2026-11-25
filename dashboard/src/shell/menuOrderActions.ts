"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { MENU_ORDER_COOKIE } from "./menuOrderStore";

const Order = z.array(z.string().regex(/^[a-z]{2,24}$/)).max(40);

// Save the owner's menu order. Checked on the server like every other change; only plain system words are accepted.
export async function saveMenuOrder(order: string[]): Promise<{ ok: boolean }> {
  const parsed = Order.safeParse(order);
  if (!parsed.success) return { ok: false };
  (await cookies()).set(MENU_ORDER_COOKIE, parsed.data.join(","), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
  return { ok: true };
}
