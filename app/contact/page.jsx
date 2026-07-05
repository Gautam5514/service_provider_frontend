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
