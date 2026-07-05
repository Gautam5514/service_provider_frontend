import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

export default function InfoPageShell({
  eyebrow,
  title,
  description,
  sections = [],
  cta,
  secondaryCta,
}) {
  return (
    <main className="min-h-screen bg-white text-zinc-950 flex flex-col">
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
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-10 md:py-16">
          <div className="mb-5 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <Link href="/" className="transition-colors hover:text-zinc-900">Home</Link>
            <ChevronRight size={12} className="text-zinc-300" />
            <span className="font-bold uppercase tracking-[0.18em] text-[#8a6d33]">{eyebrow}</span>
          </div>

          <div className="grid items-end gap-8 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="max-w-2xl text-[28px] font-extrabold leading-[1.15] tracking-tight md:text-[36px]">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-zinc-600">
                {description}
              </p>
            </div>

            {(cta || secondaryCta) && (
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                {cta && (
                  <Link
                    href={cta.href}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-zinc-950 px-6 text-xs font-bold tracking-wide text-white transition-colors hover:bg-zinc-800"
                  >
                    {cta.label}
                    <ArrowRight size={14} />
                  </Link>
                )}
                {secondaryCta && (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] border border-zinc-300 px-6 text-xs font-bold tracking-wide text-zinc-800 transition-colors hover:border-zinc-900 hover:text-black"
                  >
                    {secondaryCta.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content sections */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 md:px-10 md:py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="flex flex-col rounded-[10px] border border-zinc-200 bg-white p-7 md:p-8"
            >
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6d33]">
                {section.kicker || "Details"}
              </p>
              <h2 className="text-[19px] font-bold leading-snug tracking-tight">
                {section.title}
              </h2>
              {section.body && (
                <p className="mt-3 text-sm leading-7 text-zinc-600">{section.body}</p>
              )}
              {section.items?.length > 0 && (
                <ul className="mt-5 space-y-3 border-t border-zinc-100 pt-5">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                        <Check size={11} className="text-emerald-600" strokeWidth={3} />
                      </span>
                      <span className="text-sm font-medium leading-6 text-zinc-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {/* Support strip */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[10px] border border-zinc-200 bg-[#fafafa] px-7 py-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-zinc-900">Still have a question?</p>
            <p className="mt-1 text-[13px] text-zinc-500">
              Our support team replies fastest when you include your booking number.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-5 text-xs font-bold text-zinc-800 transition-colors hover:border-zinc-900 hover:text-black"
          >
            Contact Support
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
