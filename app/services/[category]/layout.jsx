import { CATEGORY_META, SERVICE_CATALOG } from "@/lib/services";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

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

  const title       = `Best ${meta.label} at Home Near You — From ₹${lowestPrice ?? "149"}`;
  const description = `Book the best ${meta.label.toLowerCase()} professionals at your doorstep. ${meta.description}. Upfront prices from ₹${lowestPrice ?? "149"}, KYC-verified pros, pay after service.`;

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
          name:    SITE_NAME,
          url:     SITE_URL,
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

  // Breadcrumbs help Google show "Home > Services > AC Services" in results.
  const breadcrumbJsonLd = meta
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services/${category}` },
          { "@type": "ListItem", position: 3, name: meta.label, item: `${SITE_URL}/services/${category}` },
        ],
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
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      {children}
    </>
  );
}
