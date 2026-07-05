import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import BlogExplorer from "@/components/blog/BlogExplorer";

export const metadata = {
  title: "Blog — Home Service Guides, Repair Costs & Maintenance Tips",
  description:
    "Practical guides from EliteCrew's experts: AC servicing, fridge and washing machine repairs, electrical safety, honest cost breakdowns and maintenance tips for Indian homes.",
  alternates: { canonical: "/blog" },
};

// New posts appear the moment the admin publishes them.
export const dynamic = "force-dynamic";

async function getPosts() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/blog`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "EliteCrew Blog",
    description:
      "Home service guides, honest repair cost breakdowns and maintenance tips for Indian homes.",
    publisher: { "@type": "Organization", name: "EliteCrew" },
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />

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
              href="/"
              className="hidden sm:inline-flex h-9 items-center rounded-[10px] border border-zinc-300 px-4 text-xs font-bold text-zinc-700 transition-colors hover:border-zinc-900 hover:text-black"
            >
              Home
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

      {/* Hero */}
      <header className="border-b border-zinc-200 bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-10 md:py-14">
          <div className="mb-5 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <Link href="/" className="transition-colors hover:text-zinc-900">Home</Link>
            <ChevronRight size={12} className="text-zinc-300" />
            <span className="font-bold uppercase tracking-[0.18em] text-[#8a6d33]">Blog</span>
          </div>
          <h1 className="max-w-2xl text-[28px] font-extrabold leading-[1.15] tracking-tight md:text-[36px]">
            The EliteCrew Blog
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-zinc-600">
            Honest repair costs, maintenance guides and buying advice for Indian homes — written
            by the people who fix these machines every day.
          </p>
        </div>
      </header>

      {/* Posts */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 md:px-10 md:py-14">
        <BlogExplorer posts={posts} />

        {/* CTA band */}
        <div className="mt-14 overflow-hidden rounded-2xl bg-[#0b0b0d]">
          <div className="flex flex-col items-start justify-between gap-5 px-8 py-8 sm:flex-row sm:items-center md:px-10">
            <div>
              <p className="text-[17px] font-extrabold tracking-tight text-white">
                Reading about the problem? We can fix it today.
              </p>
              <p className="mt-1.5 max-w-md text-[13.5px] leading-6 text-zinc-400">
                KYC-verified professionals for AC, fridge, electrical and appliance work — upfront
                prices, pay after service.
              </p>
            </div>
            <Link
              href="/services/ac"
              className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-[10px] bg-[#C8A45C] px-6 text-xs font-bold text-black transition-colors hover:bg-[#d7b877]"
            >
              Book a Service
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
