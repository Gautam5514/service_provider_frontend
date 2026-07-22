import Link from "next/link";
import { CATEGORY_META } from "@/lib/services";
import { ShieldCheck, Receipt, Clock, ArrowRight, MapPin, Mail } from "lucide-react";

const COMPANY_LINKS = [
  ["About Us", "/about"],
  ["How It Works", "/how-it-works"],
  ["Our Professionals", "/providers"],
  ["Blog", "/blog"],
  ["Careers", "/careers"],
];

const SUPPORT_LINKS = [
  ["Help Center", "/help"],
  ["Contact Us", "/contact"],
  ["My Bookings", "/bookings"],
  ["Terms of Service", "/terms"],
  ["Privacy Policy", "/privacy"],
];

const ASSURANCES = [
  { icon: ShieldCheck, title: "KYC-verified professionals", sub: "Every partner is identity-checked before their first job" },
  { icon: Receipt, title: "Upfront, transparent pricing", sub: "The price you see is the price you pay — invoice included" },
  { icon: Clock, title: "Pay after the work is done", sub: "Start the job with your OTP, pay only when it's complete" },
];

const SOCIAL_LINKS = [
  {
    name: "X (Twitter)",
    href: "https://x.com/Gautamp5514",
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/gautam-pandit-4b185224b/",
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.48 1.48 0 1 0 0 2.96 1.48 1.48 0 0 0 0-2.96z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/gautamp5514/",
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/Gautam5514",
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const categories = Object.entries(CATEGORY_META);

  return (
    <footer className="bg-[#0b0b0d] text-white border-t-2 border-[#C8A45C]">
      <div className="max-w-7xl mx-auto px-4 md:px-10">

        {/* Brand + partner CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-12 border-b border-white/10">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <img src="/logo-transparent.png" alt="EliteCrew" className="w-9 h-9 object-contain" />
              <span className="text-xl font-extrabold tracking-tight">
                Elite<span className="text-[#C8A45C]">Crew</span>
              </span>
            </Link>
            <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">
              India&apos;s trusted home services platform. Verified professionals for AC, fridge,
              electrical, appliance and cleaning work — at your doorstep, on your schedule.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-2.5 pt-1">
              {SOCIAL_LINKS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-[#C8A45C] hover:border-[#C8A45C] transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="lg:text-right">
            <p className="text-sm font-bold mb-1">Are you a service professional?</p>
            <p className="text-[13px] text-zinc-400 mb-4">
              Join EliteCrew Partner and get verified jobs near you.
            </p>
            <div className="flex lg:justify-end items-center gap-3">
              <Link
                href="/professional/register"
                className="inline-flex items-center gap-2 bg-[#C8A45C] text-black px-5 py-2.5 rounded-[10px] text-xs font-bold tracking-wide hover:bg-[#d7b877] transition-colors"
              >
                Register as a Professional
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/professional/login"
                className="inline-flex items-center border border-white/20 text-white px-5 py-2.5 rounded-[10px] text-xs font-bold tracking-wide hover:border-white/50 transition-colors"
              >
                Partner Login
              </Link>
            </div>
          </div>
        </div>

        {/* Link columns */}
        <nav aria-label="Footer" className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 py-12 border-b border-white/10">
          <div className="col-span-2">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C8A45C] mb-5">Services</p>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
              {categories.map(([key, m]) => (
                <li key={key}>
                  <Link
                    href={`/services/${key}`}
                    className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C8A45C] mb-5">Company</p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C8A45C] mb-5">Support</p>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2.5">
              <p className="flex items-center gap-2 text-[12px] text-zinc-500">
                <Mail size={13} className="text-zinc-600" /> support@elitecrew.in
              </p>
              <p className="flex items-center gap-2 text-[12px] text-zinc-500">
                <MapPin size={13} className="text-zinc-600" /> Serving homes across India
              </p>
            </div>
          </div>
        </nav>

        {/* Assurance strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-9 border-b border-white/10">
          {ASSURANCES.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-start gap-3.5">
              <span className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-white/5 border border-white/10 flex-shrink-0">
                <Icon size={16} className="text-[#C8A45C]" />
              </span>
              <div>
                <p className="text-[13px] font-bold leading-snug">{title}</p>
                <p className="text-[12px] text-zinc-500 leading-relaxed mt-1">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 text-center sm:text-left">
          <p className="text-[11px] text-zinc-500 font-medium">
            © {year} EliteCrew · All rights reserved
          </p>

          <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-medium flex-wrap justify-center">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C8A45C] transition-colors"
              >
                {s.name}
              </a>
            ))}
          </div>

          <p className="text-[11px] text-zinc-600 font-medium">
            Built with care for India&apos;s homes
          </p>
        </div>
      </div>
    </footer>
  );
}
