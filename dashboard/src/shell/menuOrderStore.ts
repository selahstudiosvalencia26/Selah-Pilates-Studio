import { cookies } from "next/headers";

// The order the owner chose for the systems in the menu. Until the database is connected it is kept in a cookie on this
// browser; then it becomes one row in shell_settings (menu_order), owner only, so every device sees the same order.
export const MENU_ORDER_COOKIE = "menu-order";

export async function getMenuOrder(): Promise<string[]> {
  const raw = (await cookies()).get(MENU_ORDER_COOKIE)?.value ?? "";
  return raw.split(",").filter((id) => /^[a-z]{2,24}$/.test(id)).slice(0, 40);
}
