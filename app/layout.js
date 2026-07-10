import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import SupportWidget from "@/components/SupportWidget";
import "./globals.css";

// Plus Jakarta Sans — the clean, modern geometric sans behind the
// Urban Company–style service-marketplace look. Variable font (all weights),
// self-hosted by next/font for zero layout shift and no Google requests.
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EliteCrew — Best Home Services Near You | AC, Fridge, Electrical & More",
    template: "%s | EliteCrew",
  },
  description:
    "Book the best AC service, fridge repair, electrician, cooler, fan, TV and appliance experts at home. KYC-verified professionals, upfront prices from ₹149, pay after service.",
  keywords: [
    "best AC service near me",
    "AC repair at home",
    "AC service provider",
    "fridge repair near me",
    "electrician near me",
    "cooler repair",
    "fan installation",
    "TV repair at home",
    "appliance repair",
    "home cleaning service",
    "home services",
    "EliteCrew",
  ],
  authors: [{ name: SITE_NAME }],
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "EliteCrew — Best Home Services Near You",
    description:
      "KYC-verified AC, fridge, electrical and appliance professionals at your doorstep. Upfront prices, pay after service.",
    url: "/",
    siteName: SITE_NAME,
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "EliteCrew — Professional Home Services",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EliteCrew — Best Home Services Near You",
    description:
      "KYC-verified AC, fridge, electrical and appliance professionals at your doorstep. Upfront prices, pay after service.",
    images: ["/icon.png"],
  },
};

// Sitewide structured data: tells Google who EliteCrew is (Organization) and
// what the site is (WebSite). Service-level schema lives on category pages.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description:
    "EliteCrew connects customers with KYC-verified professionals for AC service, fridge repair, electrical work, cooler, fan, TV and appliance services at home.",
  areaServed: { "@type": "Country", name: "India" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-IN",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
        <SupportWidget />
      </body>
    </html>
  );
}
