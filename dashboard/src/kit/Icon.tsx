"use client";

import { Bell, Calendar, Camera, Cart, Check, Coins, Copy, Database, EditPencil, Eye, EyeClosed, Globe, Group, HalfMoon, Home, List, LogOut, Mail, MoreHoriz, NavArrowDown, NavArrowUp, Package, Page, Plus, Puzzle, Refresh, Search, Settings, SidebarCollapse, SidebarExpand, StatsReport, SunLight, Tools, Trash, UserCircle, Wallet, WarningTriangle, Xmark } from "iconoir-react";
import type { ComponentType, SVGProps } from "react";
import type { IconName } from "./iconNames";

// The one way to show an icon, for the shell and for every system. Iconoir, imported one by one so only the icons used
// are sent to the browser. Decorative: the word next to an icon carries the meaning, so it is hidden from screen readers.
const ICONS: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  today: Home,
  calendar: Calendar,
  globe: Globe,
  wallet: Wallet,
  users: Group,
  box: Package,
  puzzle: Puzzle,
  settings: Settings,
  search: Search,
  user: UserCircle,
  bell: Bell,
  mail: Mail,
  page: Page,
  camera: Camera,
  cart: Cart,
  tools: Tools,
  chart: StatsReport,
  list: List,
  coins: Coins,
  plus: Plus,
  edit: EditPencil,
  trash: Trash,
  check: Check,
  close: Xmark,
  more: MoreHoriz,
  panel: SidebarCollapse,
  "panel-open": SidebarExpand,
  sun: SunLight,
  moon: HalfMoon,
  "chevron-down": NavArrowDown,
  "chevron-up": NavArrowUp,
  copy: Copy,
  database: Database,
  warning: WarningTriangle,
  refresh: Refresh,
  "sign-out": LogOut,
  eye: Eye,
  "eye-off": EyeClosed,
};

// Icon weight follows the weight of the text beside it, so an icon never looks thinner or heavier than its label:
// regular text (400) takes "regular", medium text (500) takes "medium", semibold (600) "semibold", bold (700) "bold".
// "light" is for large icons only.
export const ICON_WEIGHTS = { light: 1.25, regular: 1.5, medium: 1.75, semibold: 2, bold: 2.25 } as const;
export type IconWeight = keyof typeof ICON_WEIGHTS;

export default function Icon({ name, className = "h-5 w-5", weight = "regular", strokeWidth }: { name: string; className?: string; weight?: IconWeight; strokeWidth?: number }) {
  const Picture = ICONS[name as IconName] ?? Package;
  return <Picture aria-hidden className={className} strokeWidth={strokeWidth ?? ICON_WEIGHTS[weight]} />;
}
