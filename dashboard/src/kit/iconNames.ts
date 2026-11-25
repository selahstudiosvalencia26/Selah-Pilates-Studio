// The icons the dashboard uses, by the plain names a system writes in its description file (`icon: "calendar"`).
// The pictures are Iconoir (iconoir.com, MIT licence). One set everywhere, so the shell and every system look the same.
// To add an icon: add its name here and its picture in Icon.tsx. The install check refuses a name that is not listed.

export const ICON_NAMES = [
  "today",
  "calendar",
  "globe",
  "wallet",
  "users",
  "box",
  "puzzle",
  "settings",
  "search",
  "user",
  "bell",
  "mail",
  "page",
  "camera",
  "cart",
  "tools",
  "chart",
  "list",
  "coins",
  "plus",
  "edit",
  "trash",
  "check",
  "close",
  "more",
  "panel",
  "panel-open",
  "sun",
  "moon",
  "chevron-down",
  "chevron-up",
  "copy",
  "database",
  "warning",
  "refresh",
  "sign-out",
  "eye",
  "eye-off",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const isIconName = (value: unknown): value is IconName => typeof value === "string" && (ICON_NAMES as readonly string[]).includes(value);
