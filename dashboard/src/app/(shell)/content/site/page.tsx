import SiteForm from "@/systems/content/SiteForm";
import { readSite } from "@/systems/content/store";

export const dynamic = "force-dynamic";

// Site information: the facts every page of the website shares.
export default async function SiteInformationPage() {
  return <SiteForm initial={await readSite()} />;
}
