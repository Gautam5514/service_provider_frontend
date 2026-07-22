import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Briefcase, ChevronRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import ContactForm from "@/components/contact/ContactForm";

export const metadata = {
  title: "Contact Us — EliteCrew Support",
  description:
    "Reach EliteCrew support for booking help, provider onboarding, invoices, ratings or service complaints. Fill the contact form and we'll get back within 24 hours.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  { icon: Mail, label: "Email", value: "support@elitecrew.in", href: "mailto:support@elitecrew.in" },
  { icon: Phone, label: "Phone", value: "+91 90000 00000", href: "tel:+919000000000" },
  { icon: Clock, label: "Support hours", value: "9:00 AM – 8:00 PM, all days" },
  { icon: MapPin, label: "Coverage", value: "Serving homes across India" },
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

const FAQS = [
  {
    q: "How fast will I hear back?",
    a: "Our team typically responds within 24 hours on business days. You'll also get an instant confirmation email with a reference number.",
  },
  {
    q: "I have a booking issue — what should I include?",
    a: "Select \"Booking Support\" and add your booking number if you have it — it helps us pull up your job instantly.",
  },
  {
    q: "I want to become a service partner",
    a: "Select \"Become a Partner\" below, or head straight to our provider registration page to get started right away.",
  },
];

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-950">
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
              href="/help"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-zinc-950 px-4 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
            >
              Help Center
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
            <span className="font-bold uppercase tracking-[0.18em] text-[#8a6d33]">Contact</span>
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-[11px] font-bold tracking-wide text-zinc-600">
            <MessageCircle size={12} className="text-[#8a6d33]" />
            We reply within 24 hours
          </div>
          <h1 className="max-w-2xl text-[28px] font-extrabold leading-[1.15] tracking-tight md:text-[36px]">
            Talk to EliteCrew support.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-zinc-600">
            For booking help, provider onboarding, invoices, ratings, or service complaints — fill
            in the form below and our team will personally follow up.
          </p>
        </div>
      </header>

      {/* Body */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Form */}
          <div className="min-w-0">
            <ContactForm />
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                Other ways to reach us
              </p>
              <ul className="space-y-4">
                {CHANNELS.map(({ icon: Icon, label, value, href }) => {
                  const content = (
                    <>
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-zinc-100 bg-[#fafafa]">
                        <Icon size={14} className="text-[#8a6d33]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">{label}</span>
                        <span className="mt-0.5 block text-[13.5px] font-semibold text-zinc-900">{value}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={label}>
                      {href ? (
                        <a href={href} className="flex items-start gap-3 group">
                          {content}
                        </a>
                      ) : (
                        <div className="flex items-start gap-3">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 pt-4 border-t border-zinc-100">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Connect with us
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {SOCIAL_LINKS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <a
                        key={s.name}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-[#8a6d33] hover:bg-[#8a6d33] hover:text-white transition-all"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{s.name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-[#fafafa] p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                Quick answers
              </p>
              <div className="space-y-4">
                {FAQS.map(({ q, a }) => (
                  <div key={q}>
                    <p className="text-[13px] font-bold text-zinc-900">{q}</p>
                    <p className="mt-1 text-[12.5px] leading-6 text-zinc-500">{a}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/professional/register"
              className="flex items-center gap-3.5 rounded-2xl bg-[#0b0b0d] p-6 transition-colors hover:bg-zinc-900"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-white/5">
                <Briefcase size={16} className="text-[#C8A45C]" />
              </span>
              <span>
                <span className="block text-[13.5px] font-bold text-white">Want to become a partner?</span>
                <span className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-[#C8A45C]">
                  Register as a professional <ArrowRight size={12} />
                </span>
              </span>
            </Link>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
