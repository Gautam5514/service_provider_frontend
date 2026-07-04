"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import {
  AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Circle,
  Eye, EyeOff, Loader2, MailCheck,
} from "lucide-react";

// Role-aware registration. Rendered by /register (customer) and
// /professional/register (provider). The role is fixed by the route — there is
// no in-form toggle, so the two audiences never mesh up.
const ROLE = {
  customer: {
    portal: "customer",
    title: "Create your account",
    sub: "Book trusted home services in minutes.",
    submitVerify: "Verify & create account",
    successHref: "/",
    signinPrompt: "Already have an account?",
    signinHref: "/login",
    crossPrompt: "Want to offer your services?",
    crossLabel: "Join as a professional",
    crossHref: "/professional/register",
  },
  provider: {
    portal: "professional",
    title: "Become a professional",
    sub: "Create your partner account and start your verification.",
    submitVerify: "Verify & start onboarding",
    successHref: "/provider/onboarding",
    signinPrompt: "Already a partner?",
    signinHref: "/professional/login",
    crossPrompt: "Looking to book a service?",
    crossLabel: "Create a customer account",
    crossHref: "/register",
  },
};

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
const isValidPhone = (v) => /^\d{10}$/.test(String(v).trim());

const PASSWORD_RULES = [
  { label: "At least 8 characters",      test: (p) => p.length >= 8   },
  { label: "One uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "One number (0–9)",           test: (p) => /[0-9]/.test(p) },
];

function passwordStrength(p) {
  const passed = PASSWORD_RULES.filter((r) => r.test(p)).length;
  if (passed <= 1) return { label: "Weak",   color: "bg-red-400",     text: "text-red-500"     };
  if (passed === 2) return { label: "Fair",   color: "bg-amber-400",   text: "text-amber-600"   };
  if (passed === 3) return { label: "Good",   color: "bg-blue-400",    text: "text-blue-600"    };
  return             { label: "Strong", color: "bg-emerald-400", text: "text-emerald-600" };
}

function validateField(name, value) {
  switch (name) {
    case "fullName":
      if (!value.trim())            return "Full name is required.";
      if (value.trim().length < 2)  return "Name must be at least 2 characters.";
      if (value.trim().length > 60) return "Name cannot exceed 60 characters.";
      if (!/^[a-zA-Z\s.'\-]+$/.test(value.trim()))
        return "Name can only contain letters, spaces, and . ' -";
      return null;
    case "email":
      if (!value.trim())        return "Email address is required.";
      if (!isValidEmail(value)) return "Enter a valid email address (e.g. you@example.com).";
      return null;
    case "phone":
      if (!value)               return "Mobile number is required.";
      if (value.length < 10)    return `Enter ${10 - value.length} more digit${10 - value.length !== 1 ? "s" : ""}.`;
      if (!isValidPhone(value)) return "Mobile number must be exactly 10 digits.";
      return null;
    case "password":
      if (!value)             return "Password is required.";
      if (value.length < 8)   return "Password must be at least 8 characters.";
      if (!PASSWORD_RULES.every((r) => r.test(value)))
        return "Password must include uppercase, lowercase, and a number.";
      return null;
    default:
      return null;
  }
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-start gap-1.5 text-[11px] font-semibold text-red-500 mt-1.5 leading-tight">
      <AlertCircle size={12} className="shrink-0 mt-px" />{msg}
    </p>
  );
}

function Label({ htmlFor, children, right }) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={htmlFor} className="block text-[11px] font-bold tracking-widest uppercase text-zinc-500">
        {children}
      </label>
      {right}
    </div>
  );
}

const INPUT_BASE =
  "w-full rounded-[10px] border bg-zinc-50 px-4 py-2.5 text-sm text-black " +
  "placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-colors";

function inputCls(state) {
  // state: "error" | "success" | undefined
  if (state === "error")   return `${INPUT_BASE} border-red-300 focus:border-red-500`;
  if (state === "success") return `${INPUT_BASE} border-emerald-300 focus:border-emerald-500`;
  return `${INPUT_BASE} border-zinc-200 focus:border-black`;
}

export default function RegisterFlow({ role = "customer" }) {
  const cfg = ROLE[role] || ROLE.customer;
  const isProvider = role === "provider";
  const router = useRouter();

  const [step, setStep] = useState("form"); // "form" | "otp"
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role });

  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [success,  setSuccess]  = useState({});
  const [apiError, setApiError] = useState("");

  const [emailStatus, setEmailStatus] = useState("idle"); // "idle"|"checking"|"available"|"taken"
  const emailCheckRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const checkEmailAvailability = useCallback(async (email) => {
    if (!isValidEmail(email)) return;
    setEmailStatus("checking");
    clearTimeout(emailCheckRef.current);
    emailCheckRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
        if (data.available) {
          setEmailStatus("available");
          setErrors((e) => ({ ...e, email: null }));
          setSuccess((s) => ({ ...s, email: "Email is available" }));
        } else {
          setEmailStatus("taken");
          setErrors((e) => ({ ...e, email: "This email is already registered. Sign in instead." }));
          setSuccess((s) => ({ ...s, email: null }));
        }
      } catch {
        setEmailStatus("idle");
      }
    }, 600);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "phone") finalValue = value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, [name]: finalValue }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
    if (success[name]) setSuccess((s) => ({ ...s, [name]: null }));
    if (name === "email") setEmailStatus("idle");
    setApiError("");
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    const err = validateField(name, form[name]);
    if (err) {
      setErrors((ev) => ({ ...ev, [name]: err }));
      setSuccess((s) => ({ ...s, [name]: null }));
      return;
    }
    if (name === "email") checkEmailAvailability(value.trim());
    else setSuccess((s) => ({ ...s, [name]: null }));
  };

  function validateAll() {
    const errs = {};
    ["fullName", "email", "phone", "password"].forEach((name) => {
      const err = validateField(name, form[name]);
      if (err) errs[name] = err;
    });
    if (emailStatus === "taken") errs.email = "This email is already registered. Sign in instead.";
    return errs;
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    setTouched({ fullName: true, email: true, phone: true, password: true });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const first = ["fullName", "email", "phone", "password"].find((n) => errs[n]);
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
      if (msg.toLowerCase().includes("email")) setErrors((ev) => ({ ...ev, email: msg }));
      else setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits of the verification code."); return; }
    setLoading(true);
    setOtpError("");
    try {
      const { data: verifyData } = await api.post("/auth/verify-register-otp", { verificationToken, otp: code });
      // role is fixed by the route — the server creates the account with it.
      await api.post("/auth/register", { ...form, role, emailVerificationToken: verifyData.emailVerificationToken });
      const { data: loginData } = await api.post("/auth/login", { email: form.email, password: form.password, portal: cfg.portal });
      saveAuthSession({ user: loginData.user, wsToken: loginData.wsToken });
      router.push(cfg.successHref);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  const strength = form.password.length > 0 ? passwordStrength(form.password) : null;

  return (
    <AuthShell portal={cfg.portal}>
      <div className="w-full max-w-md">

        {/* ── FORM STEP ─────────────────────────────────────────────── */}
        {step === "form" && (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight text-black">{cfg.title}</h1>
            <p className="mt-1.5 text-sm text-zinc-500">{cfg.sub}</p>

            <form onSubmit={handleFormSubmit} noValidate className="mt-6 space-y-3.5">
              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full name</Label>
                <input
                  id="reg-name"
                  name="fullName"
                  autoComplete="name"
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputCls(errors.fullName ? "error" : touched.fullName && form.fullName ? "success" : undefined)}
                />
                <FieldError msg={errors.fullName} />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="reg-email"
                  right={
                    emailStatus === "checking" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                        <Loader2 size={11} className="animate-spin" /> Checking…
                      </span>
                    ) : emailStatus === "available" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 size={11} /> Available
                      </span>
                    ) : emailStatus === "taken" ? (
                      <span className="text-[10px] font-bold text-red-500">Already registered</span>
                    ) : null
                  }
                >
                  Email address
                </Label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputCls(
                    errors.email || emailStatus === "taken" ? "error"
                    : emailStatus === "available" ? "success"
                    : undefined
                  )}
                />
                <FieldError msg={errors.email} />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="reg-phone"
                  right={
                    <span className={`text-[10px] font-bold tabular-nums ${
                      form.phone.length === 10 ? "text-emerald-500"
                      : form.phone.length >= 7 ? "text-amber-500"
                      : "text-zinc-300"
                    }`}>
                      {form.phone.length}/10
                    </span>
                  }
                >
                  Mobile number
                </Label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={10}
                  className={inputCls(errors.phone ? "error" : form.phone.length === 10 ? "success" : undefined)}
                />
                <FieldError msg={errors.phone} />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="reg-password"
                  right={strength && <span className={`text-[10px] font-bold ${strength.text}`}>{strength.label}</span>}
                >
                  Password
                </Label>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputCls(
                      errors.password ? "error"
                      : touched.password && !errors.password && form.password.length > 0 ? "success"
                      : undefined
                    )} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {form.password.length > 0 && (
                  <div className="mt-2 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${strength?.color}`}
                      style={{ width: `${(PASSWORD_RULES.filter((r) => r.test(form.password)).length / PASSWORD_RULES.length) * 100}%` }}
                    />
                  </div>
                )}

                {(touched.password || form.password.length > 0) && (
                  <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(form.password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-1.5 text-[10px] font-semibold transition-colors ${ok ? "text-emerald-600" : "text-zinc-400"}`}>
                          {ok ? <CheckCircle2 size={11} className="shrink-0" /> : <Circle size={11} className="shrink-0" />}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <FieldError msg={errors.password} />
              </div>

              {/* Provider verification notice */}
              {isProvider && (
                <div className="flex items-start gap-3 rounded-[10px] border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                  <BadgeCheck size={16} className="text-[#9A6F2A] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    After registration you'll complete a{" "}
                    <span className="font-bold text-black">7-step verification</span>{" "}
                    — KYC, skills and background check — before receiving jobs.
                  </p>
                </div>
              )}

              {apiError && (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-semibold text-red-700 leading-relaxed">{apiError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || emailStatus === "checking" || emailStatus === "taken"}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-black text-white py-3 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending code…</>
                ) : emailStatus === "checking" ? (
                  <><Loader2 size={16} className="animate-spin" /> Checking email…</>
                ) : (
                  <>Continue <ArrowRight size={16} /></>
                )}
              </button>
              <p className="text-center text-[11px] text-zinc-400 -mt-1">
                We'll email you a 6-digit code to verify your address.
              </p>
            </form>
          </>
        )}

        {/* ── OTP STEP ──────────────────────────────────────────────── */}
        {step === "otp" && (
          <>
            <span className="inline-flex w-12 h-12 rounded-[10px] bg-zinc-100 border border-zinc-200 items-center justify-center mb-5">
              <MailCheck size={20} className="text-black" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-black">Check your email</h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              We sent a 6-digit code to <span className="font-bold text-black">{form.email}</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">Code expires in 10 minutes · check spam if not received</p>

            <form onSubmit={handleOTPSubmit} className="mt-6 space-y-5">
              <div className="flex gap-2.5 justify-between" onPaste={handleOTPPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${i + 1}`}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    className={`w-full aspect-[4/5] max-w-[3.5rem] text-center text-2xl font-extrabold rounded-[10px] border bg-zinc-50 text-black focus:outline-none focus:bg-white transition-colors ${
                      otpError ? "border-red-300 focus:border-red-500" : "border-zinc-200 focus:border-black"
                    }`}
                  />
                ))}
              </div>

              {otpError && (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-semibold text-red-700 leading-relaxed">{otpError}</p>
                </div>
              )}
              {otpSuccess && (
                <div className="flex items-center gap-2.5 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-emerald-700">{otpSuccess}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-black text-white py-3 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                ) : (
                  <>{cfg.submitVerify} <ArrowRight size={16} /></>
                )}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep("form"); setOtp(["","","","","",""]); setOtpError(""); setOtpSuccess(""); }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors"
                >
                  <ArrowLeft size={12} /> Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-[11px] font-bold text-zinc-400 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-100 space-y-2 text-center">
          <p className="text-sm text-zinc-500">
            {cfg.signinPrompt}{" "}
            <Link href={cfg.signinHref} className="font-bold text-black hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-zinc-400">
            {cfg.crossPrompt}{" "}
            <Link href={cfg.crossHref} className="font-bold text-zinc-600 hover:text-black hover:underline underline-offset-4">
              {cfg.crossLabel} →
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
