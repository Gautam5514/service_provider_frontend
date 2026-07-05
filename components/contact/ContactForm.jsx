"use client";

import { useState } from "react";
import api from "@/lib/api";
import { AlertCircle, ArrowRight, CheckCircle2, Send } from "lucide-react";

const TOPICS = [
  ["booking", "Booking Support"],
  ["payment", "Payment / Invoice"],
  ["provider", "Become a Partner"],
  ["complaint", "Service Complaint"],
  ["feedback", "Feedback"],
  ["other", "General Enquiry"],
];

const BLANK = {
  name: "",
  email: "",
  phone: "",
  address: "",
  topic: "booking",
  bookingNumber: "",
  message: "",
};

function Field({ label, required, hint, ...props }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
        {label} {required && <span className="text-rose-500">*</span>}
        {hint && <span className="ml-1 normal-case font-medium tracking-normal">({hint})</span>}
      </label>
      <input
        {...props}
        className="w-full rounded-[10px] border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-300 transition-colors focus:border-zinc-900 focus:outline-none"
      />
    </div>
  );
}

export default function ContactForm() {
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refNumber, setRefNumber] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setError("Please enter a valid email address.");
    if (form.message.trim().length < 10)
      return setError("Please describe your query in a bit more detail (at least 10 characters).");

    setBusy(true);
    try {
      const { data } = await api.post("/contact", form);
      setRefNumber(data.referenceNumber);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (refNumber) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center md:p-10">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-emerald-200">
          <CheckCircle2 size={26} className="text-emerald-600" />
        </span>
        <h3 className="text-[19px] font-extrabold tracking-tight text-emerald-900">
          Message sent — thank you, {form.name.split(" ")[0]}!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-emerald-800">
          Our support team will get back to you on <strong>{form.email}</strong> within 24 hours.
          Keep this reference number for follow-up:
        </p>
        <p className="mx-auto mt-4 inline-block rounded-[10px] border border-emerald-200 bg-white px-5 py-2.5 font-mono text-[15px] font-bold tracking-wide text-emerald-900">
          {refNumber}
        </p>
        <button
          type="button"
          onClick={() => { setForm(BLANK); setRefNumber(null); }}
          className="mx-auto mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-7 md:p-9">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a6d33]">
            Contact Form
          </p>
          <h2 className="text-[20px] font-extrabold tracking-tight text-zinc-900">
            Send us a message
          </h2>
          <p className="mt-1 text-[13px] text-zinc-500">
            Fields marked <span className="text-rose-500">*</span> are required. We usually reply within 24 hours.
          </p>
        </div>
        <span className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#0b0b0d] sm:flex">
          <Send size={16} className="text-[#C8A45C]" />
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required type="text" placeholder="Your name" maxLength={80} value={form.name} onChange={set("name")} />
        <Field label="Email" required type="email" placeholder="you@example.com" maxLength={120} value={form.email} onChange={set("email")} />
        <Field label="Phone" hint="optional" type="tel" placeholder="+91 98765 43210" maxLength={20} value={form.phone} onChange={set("phone")} />
        <Field label="Address" hint="optional" type="text" placeholder="City / area" maxLength={200} value={form.address} onChange={set("address")} />

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            What's this about? <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, topic: value }))}
                className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-bold transition-all ${
                  form.topic === value
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {form.topic === "booking" && (
          <div className="sm:col-span-2">
            <Field
              label="Booking number"
              hint="if this is about an existing booking"
              type="text"
              placeholder="EC-2026-04817"
              maxLength={40}
              value={form.bookingNumber}
              onChange={set("bookingNumber")}
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={6}
            maxLength={3000}
            placeholder="Tell us what happened and how we can help."
            value={form.message}
            onChange={set("message")}
            className="w-full resize-y rounded-[10px] border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-300 transition-colors focus:border-zinc-900 focus:outline-none"
          />
          <p className="mt-1.5 text-right text-[11px] text-zinc-400">{form.message.length}/3000</p>
        </div>
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0b0b0d] px-8 text-[13px] font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Sending…" : "Send Message"}
        {!busy && <ArrowRight size={15} />}
      </button>
      <p className="mt-3 text-[11.5px] text-zinc-400">
        We'll email you a confirmation with a reference number right away.
      </p>
    </form>
  );
}
