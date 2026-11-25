import {
  AboutMosaic,
  NameSection,
  PrinciplesSection,
  TeamSection,
} from "@/components/inner-sections";
import { PageHero } from "@/components/sections";
import { inner } from "@/content/inner";
import { pages } from "@/content/pages";
import { pageMeta } from "@/lib/seo";

const page = pages[1];

export const metadata = pageMeta(page.title, page.description, page.href);

export default function About() {
  const a = inner.about;
  return (
    <>
      <PageHero kicker={a.kicker} title={a.title} text={a.text} />
      <AboutMosaic />
      <PrinciplesSection />
      <NameSection />
      <TeamSection />
    </>
  );
}
