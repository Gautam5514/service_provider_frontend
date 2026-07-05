import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Clock } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ArticleBody from "@/components/blog/ArticleBody";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const initials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "EC";

async function getPost(slug) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/blog/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data?.post) return { title: "Article not found" };
  const { post } = data;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [{ url: post.coverImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data?.post) notFound();
  const { post, related = [] } = data;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${SITE_URL}${post.coverImage}`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.author?.name || "EliteCrew Team" },
    publisher: {
      "@type": "Organization",
      name: "EliteCrew",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      {/* Top nav */}
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-transparent.png"
              alt="EliteCrew"
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-extrabold tracking-tight">
              Elite<span className="text-[#C8A45C]">Crew</span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/blog"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-zinc-300 px-4 text-xs font-bold text-zinc-700 transition-colors hover:border-zinc-900 hover:text-black"
            >
              <ArrowLeft size={13} />
              All Articles
            </Link>
            <Link
              href="/services/ac"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-zinc-950 px-4 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
            >
              Book a Service
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      <article className="flex-1">
        {/* Article header */}
        <header className="mx-auto max-w-[760px] px-4 pt-10 md:pt-14">
          <div className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <Link href="/" className="transition-colors hover:text-zinc-900">Home</Link>
            <ChevronRight size={12} className="text-zinc-300" />
            <Link href="/blog" className="transition-colors hover:text-zinc-900">Blog</Link>
            <ChevronRight size={12} className="text-zinc-300" />
            <span className="font-bold uppercase tracking-[0.15em] text-[#8a6d33]">{post.category}</span>
          </div>

          <h1 className="text-[28px] font-extrabold leading-[1.18] tracking-tight md:text-[38px]" style={{ textWrap: "balance" }}>
            {post.title}
          </h1>
          <p className="mt-4 text-[16px] leading-8 text-zinc-500">{post.excerpt}</p>

          <div className="mt-7 flex items-center justify-between border-y border-zinc-100 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-[12px] font-extrabold text-[#C8A45C]">
                {initials(post.author?.name)}
              </span>
              <div className="text-[13px] leading-tight">
                <p className="font-bold text-zinc-900">{post.author?.name || "EliteCrew Team"}</p>
                <p className="mt-0.5 text-zinc-400">
                  {post.author?.role || "Home Services Experts"} · {fmtDate(post.createdAt)}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-400">
              <Clock size={12} /> {post.readMinutes} min read
            </span>
          </div>
        </header>

        {/* Cover image */}
        <div className="mx-auto mt-8 max-w-[980px] px-4">
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
            <img src={post.coverImage} alt={post.title} className="max-h-[520px] w-full object-cover" />
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto max-w-[760px] px-4 pb-4 pt-10">
          <ArticleBody content={post.content} />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-7">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full border border-zinc-200 bg-[#fafafa] px-3.5 py-1.5 text-[11.5px] font-semibold text-zinc-600">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Inline CTA */}
          <div className="mt-10 overflow-hidden rounded-2xl bg-[#0b0b0d] px-7 py-7 md:px-9">
            <p className="text-[17px] font-extrabold tracking-tight text-white">
              Need this fixed today?
            </p>
            <p className="mt-1.5 max-w-md text-[13.5px] leading-6 text-zinc-400">
              KYC-verified professionals at your doorstep — upfront pricing, digital invoice, pay
              after service.
            </p>
            <Link
              href="/services/ac"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#C8A45C] px-6 text-xs font-bold text-black transition-colors hover:bg-[#d7b877]"
            >
              Book a Verified Professional
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-10">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-[20px] font-extrabold tracking-tight">Keep reading</h2>
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-black">
                All articles <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-900"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
                    <img
                      src={r.coverImage}
                      alt={r.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-[15px] font-extrabold leading-snug tracking-tight text-zinc-900">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-[11.5px] font-semibold text-zinc-400">
                      {fmtDate(r.createdAt)} · {r.readMinutes} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <SiteFooter />
    </main>
  );
}
