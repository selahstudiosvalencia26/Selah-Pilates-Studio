import { PageHero, wrap } from "@/components/sections";
import { BOOKING_RULES } from "@/content/rules";
import { site } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Privacy and booking rules", "What we ask for when you book, why, and our booking and refund rules.", "/privacy");

const sections: { title: string; points: string[] }[] = [
  { title: "Booking and refunds", points: BOOKING_RULES },
  {
    title: "What we collect",
    points: [
      "Your name, phone number and email, and any note you add.",
      "The class you book, and your payment screenshot if you attach one.",
      "If you ask for a refund, the proof you send us, such as a medical certificate.",
    ],
  },
  {
    title: "Why we collect it",
    points: [
      "To keep your slot, check your payment and reach you about your class.",
      "To decide a refund request.",
      "We do not sell your information or use it for advertising.",
    ],
  },
  {
    title: "Who sees it and where it is kept",
    points: [
      "Only the studio and the people it has given access to.",
      "It is stored with the services that run this website and our booking system (Vercel, Supabase and Resend), some of them outside the Philippines.",
      "If you choose to be remembered, your name, phone and email stay on your own device.",
      "We keep booking and payment records for as long as we need them.",
    ],
  },
  {
    title: "Your choices",
    points: [
      "Under the Data Privacy Act of 2012 you may ask to see, correct or delete your information.",
      "Send us a message and we will answer. You may also contact the National Privacy Commission.",
    ],
  },
];

export default function Privacy() {
  return (
    <>
      <PageHero kicker="Privacy" title="Your booking, your information" text={`What ${site.name} asks for, why, and the rules for booking and refunds.`} />
      <section className="bg-page pb-24">
        <div className={wrap}>
          <div className="mx-auto grid max-w-3xl gap-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-serif text-3xl">{s.title}</h2>
                <ul className="mt-4 grid list-disc gap-2 pl-5 text-lg text-muted">
                  {s.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
