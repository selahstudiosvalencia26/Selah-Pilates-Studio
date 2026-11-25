import { canSave } from "@/kit/session";
import BrandingForm from "@/shell/branding/BrandingForm";
import { getBranding } from "@/shell/branding/server";

// Branding, for the owner (permission shell.manage once sign-in exists): name, one accent colour and a logo.
// Saved in the database on a live site.
export default async function BrandingPage() {
  const saved = await getBranding();
  return <BrandingForm saved={saved} canSave={await canSave()} />;
}
