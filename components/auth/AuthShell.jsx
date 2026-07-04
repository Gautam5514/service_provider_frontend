"use client";

import Link from "next/link";
import { ShieldCheck, CreditCard, Clock, Briefcase, Wallet, Star } from "lucide-react";

// Premium split-screen shell shared by all four auth pages
// (/login, /register, /professional/login, /professional/register).
//
// Left: dark brand panel with a real photo, headline and trust points —
// hidden on mobile, where a compact brand row renders above the form instead.
// Right: clean white form column (children).
const PANELS = {
  customer: {
    image: "/hero/heropage.webp",
    badge: null,
    headline: <>Home services,<br />done right.</>,
    sub: "Book verified professionals for AC, appliances, electrical & more.",
    perks: [
      { Icon: ShieldCheck, title: "Verified professionals", sub: "Background-checked, rated experts" },
      { Icon: CreditCard,  title: "Transparent pricing",    sub: "Upfront quotes — pay online or cash" },
      { Icon: Clock,       title: "Same-day service",       sub: "Book in minutes, sorted today" },
    ],
  },
  professional: {
    image: "/hero/electrician.webp",
    badge: "EliteCrew Pro · Partner Portal",
    headline: <>Your skills.<br />Your schedule.</>,
    sub: "Get verified jobs near you and track your earnings in one place.",
    perks: [
      { Icon: Briefcase, title: "Jobs near you",        sub: "Matched to your skills and area" },
      { Icon: Wallet,    title: "Transparent payouts",  sub: "Know your take-home on every job" },
      { Icon: Star,      title: "Build your rating",    sub: "Great work brings more bookings" },
    ],
  },
};

function Wordmark({ dark = false }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      <img
        src="/logo-transparent.png"
        alt="EliteCrew"
        className="w-8 h-8 object-contain"
      />
      <span className={`text-lg font-black tracking-tight ${dark ? "text-black" : "text-white"}`}>
        Elite<span className="text-[#C8A45C]">Crew</span>
      </span>
    </Link>
  );
}

export default function AuthShell({ portal = "customer", children }) {
  const p = PANELS[portal] || PANELS.customer;

  return (
    // Locked to the viewport on desktop — the auth pages fit on one screen.
    // The form column keeps its own overflow as a safety net for short laptops.
    <main className="min-h-screen bg-white font-sans selection:bg-black selection:text-white lg:grid lg:grid-cols-[minmax(0,44%)_1fr] lg:h-screen lg:overflow-hidden">

      {/* ── Left: brand panel (desktop only) ─────────────────────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-zinc-950 p-10 xl:p-12 lg:h-screen">
        <img
          src={p.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35" />

        <div className="relative z-10">
          <Wordmark />
        </div>

        <div className="relative z-10 max-w-md">
          {p.badge && (
            <span className="inline-block mb-5 border border-[#C8A45C]/60 text-[#E3C98A] text-[10px] font-bold tracking-[0.22em] uppercase px-3 py-1.5 rounded-full">
              {p.badge}
            </span>
          )}
          <h2 className="text-4xl xl:text-[2.75rem] font-extrabold tracking-tight text-white leading-[1.08]">
            {p.headline}
          </h2>
          <p className="mt-4 text-sm text-zinc-300 leading-relaxed max-w-sm">{p.sub}</p>

          <div className="mt-7 pt-6 border-t border-white/10 space-y-4">
            {p.perks.map(({ Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-[10px] bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-[#E3C98A]" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white leading-tight">{title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right: form column ───────────────────────────────────────── */}
      <section className="flex flex-col min-h-screen lg:h-screen lg:min-h-0 lg:overflow-y-auto">
        {/* Compact brand row — mobile only */}
        <div className="lg:hidden flex items-center justify-between bg-zinc-950 px-6 py-4">
          <Wordmark />
          {p.badge && (
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#E3C98A] border border-[#C8A45C]/50 px-2.5 py-1 rounded-full">
              Partner
            </span>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:py-6">
          {children}
        </div>

        <p className="pb-4 text-center text-[10px] text-zinc-300 font-medium flex-shrink-0">
          © {new Date().getFullYear()} EliteCrew · Secure sign-in
        </p>
      </section>
    </main>
  );
}
