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
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              India&apos;s trusted home services platform. Verified professionals for AC, fridge,
              electrical, appliance and cleaning work — at your doorstep, on your schedule.
            </p>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6">
          <p className="text-[11px] text-zinc-500 font-medium">
            © {year} EliteCrew · All rights reserved
          </p>
          <p className="text-[11px] text-zinc-600 font-medium">
            Built with care for India&apos;s homes
          </p>
        </div>
      </div>
    </footer>
  );
}
