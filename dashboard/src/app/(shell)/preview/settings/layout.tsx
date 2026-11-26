import { notFound } from "next/navigation";
import { isOwnerNow } from "@/kit/session";
import PageHeader from "@/shell/frame/PageHeader";
import SystemTabs from "@/shell/frame/SystemTabs";

// Settings is one place with two tabs along the top: how it looks, and the order of the menu.
const SETTINGS_SECTIONS = [
  { title: "Branding", href: "/preview/settings" },
  { title: "Menu", href: "/preview/settings/menu" },
  { title: "Email", href: "/preview/settings/email" },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  if (!(await isOwnerNow())) notFound();
  return (
    <>
      <PageHeader title="Settings" description="How your dashboard looks, the order of its menu, and your email." />
      <SystemTabs name="Settings" sections={SETTINGS_SECTIONS} />
      {children}
    </>
  );
}
