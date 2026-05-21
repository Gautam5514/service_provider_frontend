"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import { CheckCircle2, Circle, Eye, EyeOff, Loader2 } from "lucide-react";

// ─── Validators ────────────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
const isValidPhone = (v) => /^\d{10}$/.test(String(v).trim());

const PASSWORD_RULES = [
  { label: "At least 8 characters",         test: (p) => p.length >= 8            },
  { label: "One uppercase letter (A–Z)",     test: (p) => /[A-Z]/.test(p)          },
  { label: "One lowercase letter (a–z)",     test: (p) => /[a-z]/.test(p)          },
  { label: "One number (0–9)",               test: (p) => /[0-9]/.test(p)          },
];

function passwordStrength(p) {
  const passed = PASSWORD_RULES.filter(r => r.test(p)).length;
  if (passed <= 1) return { label: "Weak",   color: "bg-red-400",    text: "text-red-500"    };
  if (passed === 2) return { label: "Fair",   color: "bg-amber-400",  text: "text-amber-600"  };
  if (passed === 3) return { label: "Good",   color: "bg-blue-400",   text: "text-blue-600"   };
  return             { label: "Strong", color: "bg-emerald-400", text: "text-emerald-600" };
}

function validateField(name, value) {
  switch (name) {
    case "fullName":
      if (!value.trim())          return "Full name is required.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
      if (value.trim().length > 60) return "Name cannot exceed 60 characters.";
      if (!/^[a-zA-Z\s.'\-]+$/.test(value.trim()))
        return "Name can only contain letters, spaces, and . ' -";
      return null;
    case "email":
      if (!value.trim())         return "Email address is required.";
      if (!isValidEmail(value))  return "Enter a valid email address (e.g. you@example.com).";
      return null;
    case "phone":
      if (!value)                return "Mobile number is required.";
      if (value.length < 10)    return `Enter ${10 - value.length} more digit${10 - value.length !== 1 ? "s" : ""}.`;
      if (!isValidPhone(value)) return "Mobile number must be exactly 10 digits.";
      return null;
    case "password":
      if (!value)                return "Password is required.";
      if (value.length < 8)     return "Password must be at least 8 characters.";
      if (!PASSWORD_RULES.every(r => r.test(value)))
        return "Password must include uppercase, lowercase, and a number.";
      return null;
    default:
      return null;
  }
}

// ─── Atoms ─────────────────────────────────────────────────────────────────────

const GRID_BG = {
  backgroundImage:
    "linear-gradient(to right,#000 1px,transparent 1px),linear-gradient(to bottom,#000 1px,transparent 1px)",
  backgroundSize: "40px 40px",
};

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-start gap-1.5 text-[11px] font-semibold text-red-500 mt-1.5 leading-tight">
      <span className="shrink-0 mt-px">✕</span>{msg}
    </p>
  );
}

function Label({ children }) {
  return (
    <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 group-focus-within:text-black transition-colors">
      {children}
    </label>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState("form"); // "form" | "otp"
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "customer" });

  // Per-field validation state
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});  // which fields the user has visited
  const [success,  setSuccess]  = useState({});  // field-level success messages
  const [apiError, setApiError] = useState("");

  // Email availability check
  const [emailStatus, setEmailStatus] = useState("idle"); // "idle"|"checking"|"available"|"taken"
  const emailCheckRef = useRef(null);

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Form-level loading
  const [loading, setLoading] = useState(false);

  // OTP step
  const [otp,               setOtp]               = useState(["","","","","",""]);
  const [verificationToken, setVerificationToken]  = useState("");
  const [resendCooldown,    setResendCooldown]     = useState(0);
  const [otpError,          setOtpError]           = useState("");
  const [otpSuccess,        setOtpSuccess]         = useState("");
  const otpRefs     = useRef([]);
  const cooldownRef = useRef(null);

  useEffect(() => () => {
    clearInterval(cooldownRef.current);
    clearTimeout(emailCheckRef.current);
  }, []);

  function startCooldown() {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((p) => {
        if (p <= 1) { clearInterval(cooldownRef.current); return 0; }
        return p - 1;
      });
    }, 1000);
  }

  // ── Email availability check (debounced 600 ms) ───────────────────────────
  const checkEmailAvailability = useCallback(async (email) => {
    if (!isValidEmail(email)) return;
    setEmailStatus("checking");
    clearTimeout(emailCheckRef.current);
    emailCheckRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
        if (data.available) {
          setEmailStatus("available");
          setErrors(e => ({ ...e, email: null }));
          setSuccess(s => ({ ...s, email: "Email is available ✓" }));
        } else {
          setEmailStatus("taken");
          setErrors(e => ({ ...e, email: "This email is already registered. Sign in instead." }));
          setSuccess(s => ({ ...s, email: null }));
        }
      } catch {
        setEmailStatus("idle");
      }
    }, 600);
  }, []);

  // ── Field change handler ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "phone") {
      // Strip non-digits and hard-cap at 10
      finalValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setForm(f => ({ ...f, [name]: finalValue }));

    // Clear error as user types (never add errors while typing)
    if (errors[name]) setErrors(e => ({ ...e, [name]: null }));
    if (success[name]) setSuccess(s => ({ ...s, [name]: null }));
    if (name === "email") setEmailStatus("idle");
    setApiError("");
  };

  // ── Field blur handler ────────────────────────────────────────────────────
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));

    const err = validateField(name, form[name]);
    if (err) {
      setErrors(ev => ({ ...ev, [name]: err }));
      setSuccess(s => ({ ...s, [name]: null }));
      return;
    }

    // Email: run availability check after format validation passes
    if (name === "email") {
      checkEmailAvailability(value.trim());
    } else {
      // Other fields: show success if valid and touched
      setSuccess(s => ({ ...s, [name]: null }));
    }
  };

  // ── Full form validation (on submit) ────────────────────────────────────
  function validateAll() {
    const errs = {};
    ["fullName", "email", "phone", "password"].forEach(name => {
      const err = validateField(name, form[name]);
      if (err) errs[name] = err;
    });
    if (emailStatus === "taken") errs.email = "This email is already registered. Sign in instead.";
    return errs;
  }

  // ── Step 1: validate + send OTP ──────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    setTouched({ fullName: true, email: true, phone: true, password: true });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Focus the first invalid field
      const first = ["fullName", "email", "phone", "password"].find(n => errs[n]);
      document.querySelector(`[name="${first}"]`)?.focus();
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      const { data } = await api.post("/auth/send-register-otp", { email: form.email.trim() });
      setVerificationToken(data.verificationToken);
      setStep("otp");
      startCooldown();
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("email")) {
        setErrors(ev => ({ ...ev, email: msg }));
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP + register + auto-login ────────────────────────────
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits of the verification code."); return; }

    setLoading(true);
    setOtpError("");
    try {
      const { data: verifyData } = await api.post("/auth/verify-register-otp", { verificationToken, otp: code });
      await api.post("/auth/register", { ...form, emailVerificationToken: verifyData.emailVerificationToken });
      const { data: loginData } = await api.post("/auth/login", { email: form.email, password: form.password });
      saveAuthSession({ user: loginData.user, wsToken: loginData.wsToken });
      router.push(form.role === "provider" ? "/provider/onboarding" : "/");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP helpers ──────────────────────────────────────────────────────────
  function handleOTPChange(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setOtpError("");
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }
  function handleOTPKeyDown(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft"  && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) otpRefs.current[i + 1]?.focus();
  }
  function handleOTPPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split("").forEach((ch, i) => (next[i] = ch));
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setOtpError("");
    setOtpSuccess("");
    try {
      const { data } = await api.post("/auth/send-register-otp", { email: form.email.trim() });
      setVerificationToken(data.verificationToken);
      setOtp(["","","","","",""]);
      otpRefs.current[0]?.focus();
      startCooldown();
      setOtpSuccess("New code sent to your email.");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to resend. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const strength = form.password.length > 0 ? passwordStrength(form.password) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-black selection:text-white">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none fixed" style={GRID_BG} />

      <div className="z-10 w-full max-w-2xl bg-white border border-zinc-200 p-8 md:p-10 shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] relative">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black -translate-x-1 -translate-y-1" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black translate-x-1 translate-y-1" />

        {/* ── FORM STEP ──────────────────────────────────────────────── */}
        {step === "form" && (
          <>
            <div className="mb-8 text-center">
              <p className="text-zinc-400 font-bold tracking-[0.2em] uppercase text-[10px] mb-2">New Registration</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-black">Create Account.</h1>
            </div>

            <form onSubmit={handleFormSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

                {/* Full Name */}
                <div className="space-y-1 group">
                  <Label>Full Name *</Label>
                  <input
                    name="fullName"
                    autoComplete="name"
                    placeholder="e.g. Rahul Sharma"
                    value={form.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-transparent border-b pb-2 pt-1 text-black text-sm focus:outline-none transition-colors placeholder:text-zinc-300 ${
                      errors.fullName ? "border-red-400 focus:border-red-500"
                      : touched.fullName && !errors.fullName ? "border-emerald-400"
                      : "border-zinc-300 focus:border-black"
                    }`}
                  />
                  <FieldError msg={errors.fullName} />
                </div>

                {/* Email */}
                <div className="space-y-1 group">
                  <div className="flex items-center justify-between">
                    <Label>Email Address *</Label>
                    {emailStatus === "checking" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                        <Loader2 size={11} className="animate-spin" /> Checking…
                      </span>
                    )}
                    {emailStatus === "available" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 size={11} /> Available
                      </span>
                    )}
                    {emailStatus === "taken" && (
                      <span className="text-[10px] font-bold text-red-500">Already registered</span>
                    )}
                  </div>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-transparent border-b pb-2 pt-1 text-black text-sm focus:outline-none transition-colors placeholder:text-zinc-300 ${
                      errors.email || emailStatus === "taken" ? "border-red-400 focus:border-red-500"
                      : emailStatus === "available" ? "border-emerald-400"
                      : "border-zinc-300 focus:border-black"
                    }`}
                  />
                  <FieldError msg={errors.email} />
                </div>

                {/* Phone */}
                <div className="space-y-1 group">
                  <div className="flex items-center justify-between">
                    <Label>Mobile Number *</Label>
                    <span className={`text-[10px] font-bold tabular-nums transition-colors ${
                      form.phone.length === 10 ? "text-emerald-500"
                      : form.phone.length >= 7  ? "text-amber-500"
                      : "text-zinc-300"
                    }`}>
                      {form.phone.length} / 10
                    </span>
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    className={`w-full bg-transparent border-b pb-2 pt-1 text-black text-sm font-mono tracking-widest focus:outline-none transition-colors placeholder:text-zinc-300 placeholder:font-sans placeholder:tracking-normal ${
                      errors.phone ? "border-red-400 focus:border-red-500"
                      : form.phone.length === 10 ? "border-emerald-400"
                      : "border-zinc-300 focus:border-black"
                    }`}
                  />
                  <FieldError msg={errors.phone} />
                  {/* Inline suggestion for Indian numbers */}
                  {!errors.phone && form.phone.length > 0 && form.phone.length < 10 && (
                    <p className="text-[10px] text-zinc-400 font-medium">
                      Enter {10 - form.phone.length} more digit{10 - form.phone.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1 group">
                  <div className="flex items-center justify-between">
                    <Label>Password *</Label>
                    {strength && (
                      <span className={`text-[10px] font-bold ${strength.text}`}>{strength.label}</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full bg-transparent border-b pb-2 pt-1 pr-8 text-black text-sm tracking-widest focus:outline-none transition-colors placeholder:tracking-normal placeholder:text-zinc-300 ${
                        errors.password ? "border-red-400 focus:border-red-500"
                        : touched.password && !errors.password && form.password.length > 0 ? "border-emerald-400"
                        : "border-zinc-300 focus:border-black"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-0 bottom-2 text-zinc-400 hover:text-black transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {form.password.length > 0 && (
                    <div className="mt-1.5 h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${strength?.color}`}
                        style={{ width: `${(PASSWORD_RULES.filter(r => r.test(form.password)).length / PASSWORD_RULES.length) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Password checklist — shown while focused or after first touch */}
                  {(touched.password || form.password.length > 0) && (
                    <ul className="mt-2 space-y-1">
                      {PASSWORD_RULES.map(rule => {
                        const ok = rule.test(form.password);
                        return (
                          <li key={rule.label} className={`flex items-center gap-1.5 text-[10px] font-semibold transition-colors ${ok ? "text-emerald-600" : "text-zinc-400"}`}>
                            {ok
                              ? <CheckCircle2 size={11} className="shrink-0" />
                              : <Circle      size={11} className="shrink-0" />}
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <FieldError msg={errors.password} />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-1 pt-1">
                <Label>I am registering as</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { value: "customer", label: "Customer",         sub: "Book home services"   },
                    { value: "provider", label: "Service Provider",  sub: "Offer my skills"      },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                      className={`border p-4 text-left transition-all ${
                        form.role === opt.value
                          ? "border-black bg-black text-white"
                          : "border-zinc-200 bg-white text-black hover:border-zinc-400"
                      }`}
                    >
                      <p className="text-xs font-bold tracking-wide">{opt.label}</p>
                      <p className={`text-[10px] mt-0.5 ${form.role === opt.value ? "text-white/60" : "text-zinc-400"}`}>{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider info banner */}
              {form.role === "provider" && (
                <div className="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 leading-relaxed">
                  After registration you will complete a{" "}
                  <span className="font-bold text-black">7-step verification process</span>{" "}
                  including KYC, skill verification, and background check before receiving jobs.
                </div>
              )}

              {/* API error */}
              {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || emailStatus === "checking" || emailStatus === "taken"}
                className="w-full bg-black text-white py-3.5 mt-2 text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-all disabled:opacity-50 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Sending verification code…</>
                    : emailStatus === "checking"
                    ? <><Loader2 size={14} className="animate-spin" /> Checking email…</>
                    : "Continue → Verify Email"}
                </span>
                <div className="absolute inset-0 h-full w-0 bg-white/20 group-hover:w-full transition-all duration-300 ease-out z-0" />
              </button>
            </form>
          </>
        )}

        {/* ── OTP STEP ──────────────────────────────────────────────── */}
        {step === "otp" && (
          <>
            <div className="mb-8 text-center">
              <p className="text-zinc-400 font-bold tracking-[0.2em] uppercase text-[10px] mb-2">Email Verification</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-black">Check Your Email.</h1>
              <p className="mt-3 text-sm text-zinc-500">
                We sent a 6-digit code to{" "}
                <span className="font-bold text-black">{form.email}</span>
              </p>
              <p className="mt-1 text-[10px] text-zinc-400 font-medium">
                Code expires in 10 minutes · check spam if not received
              </p>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 text-center">
                  Enter 6-digit Code
                </label>
                <div className="flex gap-3 justify-center" onPaste={handleOTPPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOTPChange(i, e.target.value)}
                      onKeyDown={e => handleOTPKeyDown(i, e)}
                      className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl font-extrabold border-b-2 focus:outline-none bg-transparent text-black transition-colors ${
                        otpError ? "border-red-400 focus:border-red-500" : "border-zinc-300 focus:border-black"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
                  {otpError}
                </div>
              )}
              {otpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> {otpSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full bg-black text-white py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Verifying…</>
                    : form.role === "provider"
                    ? "Verify & Start Onboarding →"
                    : "Verify & Create Account →"}
                </span>
                <div className="absolute inset-0 h-full w-0 bg-white/20 group-hover:w-full transition-all duration-300 ease-out z-0" />
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep("form"); setOtp(["","","","","",""]); setOtpError(""); setOtpSuccess(""); }}
                  className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-black transition-colors"
                >
                  ← Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="mt-8 text-center border-t border-zinc-100 pt-5">
          <p className="text-[10px] font-medium text-zinc-500 tracking-widest uppercase">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-extrabold hover:underline underline-offset-4 ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
