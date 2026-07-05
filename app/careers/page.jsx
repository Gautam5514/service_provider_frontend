import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight, Compass, HeartHandshake, Rocket, Sparkles } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import JobsExplorer from "@/components/careers/JobsExplorer";

export const metadata = {
  title: "Careers — Build the Future of Home Services",
  description:
    "Join the EliteCrew team. See open roles in engineering, design, operations and support — and apply directly online.",
  alternates: { canonical: "/careers" },
};

// Job postings change whenever the admin publishes one — never cache this page.
export const dynamic = "force-dynamic";

const VALUES = [
  {
    icon: Rocket,
    title: "Ship things that matter",
    sub: "Your work reaches thousands of homes and the professionals who serve them.",
  },
  {
    icon: HeartHandshake,
    title: "Trust is the product",
    sub: "We hold a high bar because customers let us into their homes every day.",
  },
  {
    icon: Compass,
    title: "Own your craft",
    sub: "Small team, real ownership — you'll shape decisions, not just execute them.",
  },
];

async function getOpenJobs() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/careers`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.careers || [];
  } catch {
    return [];
  }
}

export default async function CareersPage() {
  const jobs = await getOpenJobs();
  const teams = new Set(jobs.map((j) => j.department)).size;

  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-950">
      {/* Top nav — dark to blend with the hero */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0d]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-transparent.png"
              alt="EliteCrew"
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-extrabold tracking-tight text-white">
              Elite<span className="text-[#C8A45C]">Crew</span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="hidden sm:inline-flex h-9 items-center rounded-[10px] border border-white/20 px-4 text-xs font-bold text-white/90 transition-colors hover:border-white/60 hover:text-white"
            >
              Home
            </Link>
            <a
              href="#roles"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#C8A45C] px-4 text-xs font-bold text-black transition-colors hover:bg-[#d7b877]"
            >
              View Open Roles
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden bg-[#0b0b0d] text-white">
        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* gold glow */}
        <div
          className="pointer-events-none absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #C8A45C 0%, transparent 65%)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 md:px-10 md:pb-20 md:pt-18">
          <div className="mb-6 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <ChevronRight size={12} className="text-zinc-700" />
            <span className="font-bold uppercase tracking-[0.2em] text-[#C8A45C]">Careers</span>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold tracking-wide text-zinc-300">
            <Sparkles size={12} className="text-[#C8A45C]" />
            {jobs.length > 0
              ? `${jobs.length} open role${jobs.length === 1 ? "" : "s"} across ${teams} team${teams === 1 ? "" : "s"}`
              : "We're growing — new roles open regularly"}
          </div>

          <h1 className="max-w-3xl text-[34px] font-extrabold leading-[1.08] tracking-tight md:text-[52px]">
            Do the best work of your career,{" "}
            <span className="text-[#C8A45C]">for India&apos;s homes.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-zinc-400 md:text-base">
            EliteCrew connects thousands of customers with verified professionals every day.
            We&apos;re a small team with a high bar — real ownership, visible impact, zero busywork.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#roles"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#C8A45C] px-7 text-[13px] font-bold text-black transition-colors hover:bg-[#d7b877]"
            >
              Browse Open Roles
              <ArrowRight size={15} />
            </a>
            <Link
              href="/about"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/20 px-7 text-[13px] font-bold text-white transition-colors hover:border-white/60"
            >
              About EliteCrew
            </Link>
          </div>

          {/* Values — glass cards on the dark hero */}
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/5">
                  <Icon size={17} className="text-[#C8A45C]" />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold leading-snug text-white">{title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Open roles */}
      <section id="roles" className="mx-auto w-full max-w-7xl flex-1 scroll-mt-20 px-4 py-14 md:px-10 md:py-18">
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a6d33]">
            We&apos;re hiring
          </p>
          <h2 className="text-[24px] font-extrabold tracking-tight md:text-[28px]">Open roles</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Pick a team, open a role, and apply in under two minutes.
          </p>
        </div>

        <JobsExplorer jobs={jobs} />

        {/* General application note */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-[#0b0b0d]">
          <div className="flex flex-col items-start justify-between gap-5 px-8 py-8 sm:flex-row sm:items-center md:px-10">
            <div>
              <p className="text-[17px] font-extrabold tracking-tight text-white">
                Don&apos;t see the right role?
              </p>
              <p className="mt-1.5 max-w-md text-[13.5px] leading-6 text-zinc-400">
                Tell us what you&apos;re great at — we read every application and keep strong
                profiles on file for the next opening.
              </p>
            </div>
            <a
              href="mailto:careers@elitecrew.in"
              className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-[10px] bg-[#C8A45C] px-6 text-xs font-bold text-black transition-colors hover:bg-[#d7b877]"
            >
              careers@elitecrew.in
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
