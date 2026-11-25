import BrandingForm from "@/shell/branding/BrandingForm";
import { getBranding } from "@/shell/branding/server";

// Branding, for the owner (permission shell.manage once sign-in exists): name, one accent colour and a logo.
// Saving works while you build; on a live site it is off until the database is connected.
export default async function BrandingPage() {
  const saved = await getBranding();
  return <BrandingForm saved={saved} canSave={process.env.NODE_ENV !== "production"} />;
}
