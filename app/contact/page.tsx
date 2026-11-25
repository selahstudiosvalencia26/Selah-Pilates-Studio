import {
  ArrowUpRight,
  CalendarCheck,
  Envelope,
  FacebookLogo,
  InstagramLogo,
  Phone,
} from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";
import { ContactForm } from "@/components/ContactForm";
import { FindUsSection } from "@/components/inner-sections";
import { Reveal } from "@/components/Reveal";
import { Kicker, PageHero, wrap } from "@/components/sections";
import { classes } from "@/content/classes";
import { inner } from "@/content/inner";
import { pages } from "@/content/pages";
import { site } from "@/content/site";
import { messengerUrl } from "@/lib/social";
import { pageMeta } from "@/lib/seo";

const page = pages.find((p) => p.href === "/contact")!;

export const metadata = pageMeta(page.title, page.description, page.href);

type Channel = {
  title: string;
  text: string;
  href: string;
  Icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" }>;
  external: boolean;
};

// The handle in an Instagram address, for example "@selah.vlc".
function instagramHandle(url: string) {
  try {
    const name = new URL(url).pathname.replace(/\//g, "");
    return name ? `@${name}` : url;
  } catch {
    return url;
  }
}

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default function Contact() {
  const c = inner.contact;

  const channels: Channel[] = [
    ...(site.bookingUrl
      ? [
          {
            title: c.bookTitle,
            text: c.bookText,
            href: site.bookingUrl,
            Icon: CalendarCheck,
            external: true,
          },
        ]
      : []),
    ...(site.facebook
      ? [
          {
            title: c.facebookTitle,
            text: c.facebookText,
            href: site.facebook,
            Icon: FacebookLogo,
            external: true,
          },
        ]
      : []),
    ...(site.instagram
      ? [
          {
            title: c.instagramTitle,
            text: instagramHandle(site.instagram),
            href: site.instagram,
            Icon: InstagramLogo,
            external: true,
          },
        ]
      : []),
    ...(site.phone
      ? [
          {
            title: c.phoneTitle,
            text: site.phone,
            href: `tel:${site.phone}`,
            Icon: Phone,
            external: false,
          },
        ]
      : []),
    ...(site.email
      ? [
          {
            title: c.emailTitle,
            text: site.email,
            href: `mailto:${site.email}`,
            Icon: Envelope,
            external: false,
          },
        ]
      : []),
  ];

  const options = classes.map((k) => ({
    name: k.name,
    price: k.pricePhp !== null ? peso.format(k.pricePhp) : "",
  }));

  return (
    <>
      <PageHero kicker={c.kicker} title={c.title} text={c.text} />

      <section className="bg-page pb-24 sm:pb-32">
        <Reveal className={wrap}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
            {/* Left: other ways to reach us */}
            <div className="lg:pt-4">
              <Kicker>{c.channelsKicker}</Kicker>
              <h2 className="mt-4 text-balance font-serif text-[length:var(--text-title)] leading-[1.1]">
                {c.channelsTitle}
              </h2>
              <ul className="mt-10">
                {channels.map(({ title, text, href, Icon, external }) => (
                  <li
                    key={title}
                    className="border-t border-line last:border-b"
                  >
                    <a
                      href={href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group flex items-center gap-5 py-5"
                    >
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-sand transition-colors duration-300 group-hover:bg-ink group-hover:text-page">
                        <Icon aria-hidden="true" size={22} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-lg font-medium">
                          {title}
                        </span>
                        <span className="block text-muted">{text}</span>
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        size={20}
                        className="text-muted transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </a>
                  </li>
                ))}
              </ul>
              {(!site.phone || !site.email) && (
                <p className="mt-4 text-base text-muted">{c.moreSoon}</p>
              )}
            </div>

            {/* Right: the message form */}
            <div className="rounded-panel bg-sand p-8 sm:p-12">
              <h2 className="text-balance font-serif text-[length:var(--text-title)] leading-[1.1]">
                {c.form.title}
              </h2>
              <p className="mt-3 mb-8 text-muted">{c.form.text}</p>
              <ContactForm
                classes={options}
                messengerUrl={messengerUrl(site.facebook)}
                studio={site.name}
              />
            </div>
          </div>
        </Reveal>
      </section>

      <FindUsSection />
    </>
  );
}
