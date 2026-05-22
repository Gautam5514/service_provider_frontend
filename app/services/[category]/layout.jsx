import { CATEGORY_META, SERVICE_CATALOG } from "@/lib/services";

export async function generateMetadata({ params }) {
  const { category } = await params;
  const meta     = CATEGORY_META[category];
  const services = SERVICE_CATALOG[category] || [];

  if (!meta) {
    return { title: "Service Category Not Found" };
  }

  const lowestPrice = services.length
    ? Math.min(...services.map(s => s.price))
    : null;

  const title       = `${meta.label} Near You — Starting ₹${lowestPrice ?? "149"} | EliteCrew`;
  const description = `Book verified ${meta.label} professionals at your doorstep. ${meta.description}. Starting from ₹${lowestPrice ?? "149"}. Pay after service. KYC-verified pros.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card:        "summary",
      title,
      description,
    },
    alternates: {
      canonical: `/services/${category}`,
    },
  };
}

export default async function ServiceCategoryLayout({ children, params }) {
  const { category } = await params;
  const meta     = CATEGORY_META[category];
  const services = SERVICE_CATALOG[category] || [];

  // Build JSON-LD only when the category is valid.
  // This enables Google rich results for individual service listings.
  const jsonLd = meta
    ? {
        "@context": "https://schema.org",
        "@type":    "Service",
        name:       meta.label,
        description: meta.description,
        provider: {
          "@type": "LocalBusiness",
          name:    "EliteCrew",
          url:     process.env.NEXT_PUBLIC_SITE_URL || "https://elitecrew.example.com",
        },
        areaServed: {
          "@type": "Country",
          name:    "India",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name:    `${meta.label} Services`,
          itemListElement: services.map((svc, idx) => ({
            "@type":    "Offer",
            position:   idx + 1,
            name:       svc.name,
            price:      svc.price,
            priceCurrency: "INR",
            priceSpecification: {
              "@type":          "UnitPriceSpecification",
              price:            svc.price,
              priceCurrency:    "INR",
              unitText:         svc.unit === "per_visit" ? "per visit" : svc.unit,
            },
            eligibleDuration: {
              "@type": "QuantitativeValue",
              value:   svc.duration,
            },
          })),
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
