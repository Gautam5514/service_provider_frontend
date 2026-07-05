"use client";

import { useState } from "react";
import api from "@/lib/api";
import { AlertCircle, ArrowRight, CheckCircle2, Send } from "lucide-react";

const BLANK = { name: "", email: "", phone: "", portfolio: "", resumeUrl: "", coverNote: "" };

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

export default function ApplyForm({ jobId, jobTitle }) {
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setError("Please enter a valid email address.");
    if (form.phone.trim().replace(/\D/g, "").length < 10)
      return setError("Please enter a valid phone number.");

    setBusy(true);
    try {
      await api.post(`/careers/${jobId}/apply`, form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit your application. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center md:p-10">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-emerald-200">
          <CheckCircle2 size={26} className="text-emerald-600" />
        </span>
        <h3 className="text-[19px] font-extrabold tracking-tight text-emerald-900">
          Application received — thank you, {form.name.split(" ")[0]}!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-emerald-800">
          Our team reviews every application personally. If your profile matches the{" "}
          <strong>{jobTitle}</strong> role, we&apos;ll reach out on{" "}
          <strong>{form.email}</strong> within a few days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-7 md:p-9">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a6d33]">
            Application
          </p>
          <h3 className="text-[20px] font-extrabold tracking-tight text-zinc-900">
            Apply for {jobTitle}
          </h3>
          <p className="mt-1 text-[13px] text-zinc-500">
            Takes under two minutes. Fields marked <span className="text-rose-500">*</span> are required.
          </p>
        </div>
        <span className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#0b0b0d] sm:flex">
          <Send size={16} className="text-[#C8A45C]" />
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required type="text" placeholder="Your name" maxLength={80} value={form.name} onChange={set("name")} />
        <Field label="Email" required type="email" placeholder="you@example.com" maxLength={120} value={form.email} onChange={set("email")} />
        <Field label="Phone" required type="tel" placeholder="+91 98765 43210" maxLength={20} value={form.phone} onChange={set("phone")} />
        <Field label="LinkedIn / Portfolio" type="url" placeholder="https://linkedin.com/in/you" maxLength={300} value={form.portfolio} onChange={set("portfolio")} />
        <div className="sm:col-span-2">
          <Field label="Resume link" hint="Drive / Dropbox — make sure it's shareable" type="url" placeholder="https://drive.google.com/…" maxLength={300} value={form.resumeUrl} onChange={set("resumeUrl")} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Why you? <span className="normal-case font-medium tracking-normal">(optional, but it helps)</span>
          </label>
          <textarea
            rows={5}
            maxLength={2000}
            placeholder="A few lines about you, your proudest work, and why this role fits."
            value={form.coverNote}
            onChange={set("coverNote")}
            className="w-full resize-y rounded-[10px] border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-300 transition-colors focus:border-zinc-900 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0b0b0d] px-8 text-[13px] font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Submitting…" : "Submit Application"}
        {!busy && <ArrowRight size={15} />}
      </button>
      <p className="mt-3 text-[11.5px] text-zinc-400">
        By applying you agree to be contacted about this role. We never share your details.
      </p>
    </form>
  );
}
