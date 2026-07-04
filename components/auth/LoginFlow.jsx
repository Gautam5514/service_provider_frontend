"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { getDashboardPath, saveAuthSession } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

// Portal-aware login. `portal` decides the copy, where a successful login
// lands, and — via the backend — which roles are allowed to sign in here.
const PORTAL = {
  customer: {
    title: "Welcome back",
    sub: "Sign in to book services and track your visits.",
    submitIdle: "Sign in",
    registerPrompt: "New to EliteCrew?",
    registerLabel: "Create an account",
    registerHref: "/register",
    crossPrompt: "Are you a service professional?",
    crossLabel: "Partner login",
    crossHref: "/professional/login",
  },
  professional: {
    title: "Partner login",
    sub: "Sign in to your EliteCrew professional account.",
    submitIdle: "Sign in to work",
    registerPrompt: "Not a partner yet?",
    registerLabel: "Become a professional",
    registerHref: "/professional/register",
    crossPrompt: "Looking to book a service?",
    crossLabel: "Customer login",
    crossHref: "/login",
  },
};

export default function LoginFlow({ portal = "customer" }) {
  const cfg = PORTAL[portal] || PORTAL.customer;
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { ...form, portal });
      saveAuthSession({ user: data.user, wsToken: data.wsToken });

      if (data.user?.role === "provider") {
        // Skip straight to the dashboard if onboarding is fully done.
        try {
          const statusRes = await api.get("/providers/onboarding/status");
          const { onboardingStarted, steps } = statusRes.data;
          const allDone = onboardingStarted && steps?.[7]?.complete === true;
          router.push(allDone ? "/dashboard/provider" : "/provider/onboarding");
        } catch {
          router.push("/provider/onboarding");
        }
      } else {
        router.push(getDashboardPath(data.user?.role));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-[10px] border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-black " +
    "placeholder:text-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-colors";

  return (
    <AuthShell portal={portal}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-black">{cfg.title}</h1>
        <p className="mt-1.5 text-sm text-zinc-500">{cfg.sub}</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-[11px] font-bold tracking-widest uppercase text-zinc-500">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-[11px] font-bold tracking-widest uppercase text-zinc-500">
                Password
              </label>
              <Link href="/forgot-password" className="text-[11px] font-bold text-zinc-400 hover:text-black transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                className={`${inputCls} pr-11`}
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
          </div>

          {message && (
            <div className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold text-red-700 leading-relaxed">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-black text-white py-3 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Signing in…</>
            ) : (
              <>{cfg.submitIdle} <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-zinc-100 space-y-2 text-center">
          <p className="text-sm text-zinc-500">
            {cfg.registerPrompt}{" "}
            <Link href={cfg.registerHref} className="font-bold text-black hover:underline underline-offset-4">
              {cfg.registerLabel}
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
