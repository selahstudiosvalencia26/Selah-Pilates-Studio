import type { Metadata, Viewport } from "next";
import "./globals.css";
import { sans, serif } from "@/lib/fonts";
import { siteUrl } from "@/lib/seo";
import { classes } from "@/content/classes";
import { hours } from "@/content/hours";
import { JsonLd } from "@/components/JsonLd";
import { site, metaDescription } from "@/content/site";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { IntroLock } from "@/components/IntroLock";
import { SmoothScroll } from "@/components/SmoothScroll";
import { MobileBookBar } from "@/components/MobileBookBar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: metaDescription,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const prices = classes.flatMap((c) => c.pricePhp ?? []);

const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: site.name,
  description: metaDescription,
  ...(site.tagline ? { slogan: site.tagline } : {}),
  url: siteUrl,
  logo: `${siteUrl}/logo-mark.png`,
  geo: {
    "@type": "GeoCoordinates",
    latitude: site.geo.latitude,
    longitude: site.geo.longitude,
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: `${site.address.street}, ${site.address.barangay}`,
    postalCode: site.address.postalCode,
    addressLocality: site.address.city,
    addressRegion: site.address.province,
    addressCountry: site.address.country,
  },
  ...(site.phone ? { telephone: site.phone } : {}),
  ...(site.email ? { email: site.email } : {}),
  openingHoursSpecification: hours
    .filter((d) => d.opens24 && d.closes24)
    .map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: d.day,
      opens: d.opens24,
      closes: d.closes24,
    })),
  sameAs: [site.facebook, site.instagram].filter(Boolean),
  image: `${siteUrl}/opengraph-image`,
  areaServed: `${site.address.city}, ${site.address.province}`,
  currenciesAccepted: "PHP",
  // What can be booked, with its price, from the same class list the pages show.
  ...(prices.length
    ? {
        priceRange: `\u20b1${Math.min(...prices).toLocaleString("en-PH")} to \u20b1${Math.max(...prices).toLocaleString("en-PH")}`,
      }
    : {}),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Pilates classes",
    itemListElement: classes.map((c) => ({
      "@type": "Offer",
      ...(c.pricePhp !== null
        ? { price: c.pricePhp, priceCurrency: "PHP" }
        : {}),
      itemOffered: {
        "@type": "Service",
        name: c.name,
        category: c.group,
        ...(c.summary ? { description: c.summary } : {}),
      },
    })),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:p-3">
          Skip to content
        </a>
        <IntroLock />
        <SmoothScroll />
        <ScrollIndicator />
        <Navigation />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileBookBar />
        <JsonLd data={businessJsonLd} />
      </body>
    </html>
  );
}
