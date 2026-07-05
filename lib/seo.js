// Central SEO configuration. Set NEXT_PUBLIC_SITE_URL in .env to the real
// production domain — every canonical URL, sitemap entry, and JSON-LD block
// derives from it.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://elitecrew.example.com"
).replace(/\/$/, "");

export const SITE_NAME = "EliteCrew";
export const SITE_TAGLINE = "Professional Home Services";

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
