import { SITE_URL } from "@/lib/seo";
import { CATEGORY_META } from "@/lib/services";

async function getBlogEntries() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/blog`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.posts || []).map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();

  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/providers", priority: 0.6, changeFrequency: "monthly" },
    { path: "/professional/register", priority: 0.7, changeFrequency: "monthly" },
    { path: "/register", priority: 0.5, changeFrequency: "monthly" },
    { path: "/help", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
    { path: "/careers", priority: 0.4, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  ];

  const categoryPages = Object.keys(CATEGORY_META).map((category) => ({
    path: `/services/${category}`,
    priority: 0.9,
    changeFrequency: "weekly",
  }));

  const blogEntries = await getBlogEntries();

  return [
    ...[...staticPages, ...categoryPages].map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...blogEntries,
  ];
}
