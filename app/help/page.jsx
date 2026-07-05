import InfoPageShell from "@/components/InfoPageShell";

export const metadata = {
  title: "Help Center — Bookings, Payments & Support",
  description:
    "Quick answers about booking status, provider assignment, payments, invoices, ratings and account support on EliteCrew.",
  alternates: { canonical: "/help" },
};

// FAQ rich-result markup — mirrors the questions answered on this page.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where can I see my service status?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open My Bookings to see pending, accepted, in-progress, completed, rating, and invoice details for each booking.",
      },
    },
    {
      "@type": "Question",
      name: "Why is a provider not assigned yet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The platform checks active providers near your service address, category match, availability, and working radius. Assignment happens when an eligible provider accepts.",
      },
    },
  ],
};

export default function HelpCenterPage() {
  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
    />
    <InfoPageShell
      eyebrow="Support"
      title="Help Center"
      description="Find quick answers for bookings, provider assignment, payment, invoice, ratings, and account support."
      cta={{ label: "My Bookings", href: "/bookings" }}
      secondaryCta={{ label: "Contact Us", href: "/contact" }}
      sections={[
        {
          kicker: "Booking",
          title: "Where can I see my service status?",
          body: "Open My Bookings to see pending, accepted, in-progress, completed, rating, and invoice details for each booking.",
          items: ["Provider assignment appears after acceptance", "Completed bookings can show invoice and rating options", "Use the booking number for support"],
        },
        {
          kicker: "Provider",
          title: "Why is a provider not assigned yet?",
          body: "The platform checks active providers near your service address, category match, availability, and working radius. Assignment happens when an eligible provider accepts.",
          items: ["Keep address accurate", "Use GPS location when possible", "Support can help with delayed matching"],
        },
      ]}
    />
    </>
  );
}
