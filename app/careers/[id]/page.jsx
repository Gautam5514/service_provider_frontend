import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  IndianRupee,
  MapPin,
} from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ApplyForm from "@/components/careers/ApplyForm";

export const dynamic = "force-dynamic";

const TYPE_LABEL = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

async function getJob(id) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/careers/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.career || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Role not found" };
  return {
    title: `${job.title} — Careers`,
    description: job.summary,
    alternates: { canonical: `/careers/${id}` },
  };
}

export default async function JobDetailPage({ params }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const posted = new Date(job.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const facts = [
    { icon: Building2, label: "Team", value: job.department },
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Clock, label: "Type", value: TYPE_LABEL[job.type] || job.type },
    job.experience && { icon: Briefcase, label: "Experience", value: job.experience },
    job.salaryRange && { icon: IndianRupee, label: "Compensation", value: job.salaryRange },
    { icon: CalendarDays, label: "Posted", value: posted },
  ].filter(Boolean);

  // JSON-LD so the role can appear in Google Jobs results
  const jobJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.summary,
    datePosted: job.createdAt,
    employmentType: (job.type || "full_time").toUpperCase(),
    hiringOrganization: { "@type": "Organization", name: "EliteCrew" },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IN" },
    },
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd) }} />

      {/* Top nav */}
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
              href="/careers"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/20 px-4 text-xs font-bold text-white/90 transition-colors hover:border-white/60 hover:text-white"
            >
              <ArrowLeft size={13} />
              All Roles
            </Link>
            <a
              href="#apply"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#C8A45C] px-4 text-xs font-bold text-black transition-colors hover:bg-[#d7b877]"
            >
              Apply Now
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden bg-[#0b0b0d] text-white">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="pointer-events-none absolute -top-40 right-[-12%] h-[420px] w-[420px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #C8A45C 0%, transparent 65%)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-10 md:py-16">
          <div className="mb-6 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <ChevronRight size={12} className="text-zinc-700" />
            <Link href="/careers" className="transition-colors hover:text-white">Careers</Link>
            <ChevronRight size={12} className="text-zinc-700" />
            <span className="font-bold uppercase tracking-[0.2em] text-[#C8A45C]">{job.department}</span>
          </div>

          <h1 className="max-w-3xl text-[30px] font-extrabold leading-[1.12] tracking-tight md:text-[42px]">
            {job.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {[
              [MapPin, job.location],
              [Clock, TYPE_LABEL[job.type] || job.type],
              job.experience && [Briefcase, job.experience],
              job.salaryRange && [IndianRupee, job.salaryRange],
            ]
              .filter(Boolean)
              .map(([Icon, label]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-zinc-300"
                >
                  <Icon size={12} className="text-[#C8A45C]" />
                  {label}
                </span>
              ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#apply"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#C8A45C] px-8 text-[13px] font-bold text-black transition-colors hover:bg-[#d7b877]"
            >
              Apply Now
              <ArrowRight size={15} />
            </a>
            <Link
              href="/careers"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-white/20 px-6 text-[13px] font-bold text-white transition-colors hover:border-white/60"
            >
              <ArrowLeft size={14} />
              All open roles
            </Link>
          </div>
        </div>
      </header>

      {/* Body */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Left — role content */}
          <div className="min-w-0">
            <div className="mb-10">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a6d33]">
                About the role
              </p>
              <p className="max-w-3xl text-[15px] leading-8 text-zinc-600">{job.summary}</p>
            </div>

            {job.responsibilities?.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-[19px] font-extrabold tracking-tight">What you&apos;ll do</h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((r) => (
                    <li key={r} className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-950">
                        <Check size={11} className="text-[#C8A45C]" strokeWidth={3} />
                      </span>
                      <span className="text-[14.5px] leading-7 text-zinc-700">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements?.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-[19px] font-extrabold tracking-tight">
                  What we&apos;re looking for
                </h2>
                <ul className="space-y-3">
                  {job.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                        <Check size={11} className="text-emerald-600" strokeWidth={3} />
                      </span>
                      <span className="text-[14.5px] leading-7 text-zinc-700">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hiring process */}
            <div className="mb-2 rounded-2xl border border-zinc-200 bg-[#fafafa] p-7">
              <h2 className="mb-5 text-[16px] font-extrabold tracking-tight">How we hire</h2>
              <ol className="grid gap-5 sm:grid-cols-3">
                {[
                  ["Apply", "Send your application below — it takes under two minutes."],
                  ["Meet the team", "One or two focused conversations about your craft and how you work."],
                  ["Offer", "We move fast — most candidates hear back within days, not weeks."],
                ].map(([title, sub], i) => (
                  <li key={title} className="relative">
                    <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-[12px] font-extrabold text-[#C8A45C]">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] font-bold text-zinc-900">{title}</p>
                    <p className="mt-1 text-[12.5px] leading-6 text-zinc-500">{sub}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right — sticky role snapshot */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                Role snapshot
              </p>
              <ul className="space-y-4">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] border border-zinc-100 bg-[#fafafa]">
                      <Icon size={14} className="text-[#8a6d33]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">{label}</p>
                      <p className="mt-0.5 text-[13.5px] font-semibold text-zinc-900">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <a
                href="#apply"
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0b0b0d] text-[13px] font-bold text-white transition-colors hover:bg-zinc-800"
              >
                Apply Now
                <ArrowRight size={14} />
              </a>
            </div>
          </aside>
        </div>

        {/* Apply */}
        <div id="apply" className="mt-14 scroll-mt-24 lg:max-w-[calc(100%-380px)]">
          <ApplyForm jobId={job._id} jobTitle={job.title} />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
