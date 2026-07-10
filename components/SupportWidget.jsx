"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { AUTH_CHANGED_EVENT, getStoredUser } from "@/lib/auth";
import { SUPPORT_OPEN_EVENT } from "@/lib/supportWidget";
import { CheckCircle2, Link2, Loader2, MessageSquare, Send, X } from "lucide-react";

// Routes where the floating button is hidden (they have their own support UX,
// or are the support chat itself).
const HIDDEN_PREFIXES = ["/admin", "/support"];

const CATEGORIES_BY_ROLE = {
  customer: [
    { value: "booking_issue",      label: "Booking Issue"      },
    { value: "payment_issue",      label: "Payment Issue"      },
    { value: "provider_complaint", label: "Provider Complaint" },
    { value: "app_bug",            label: "App Bug / Error"    },
    { value: "general",            label: "General Enquiry"    },
  ],
  provider: [
    { value: "booking_issue",  label: "Booking Issue"    },
    { value: "payment_issue",  label: "Payment / Payout Issue" },
    { value: "customer_issue", label: "Customer Issue"   },
    { value: "app_bug",        label: "App Bug / Error"  },
    { value: "general",        label: "General Enquiry"  },
  ],
};

export default function SupportWidget() {
  const router   = useRouter();
  const pathname = usePathname();
  const wrapRef  = useRef(null);

  // ── All hooks first — unconditional ──────────────────────────────────────
  const [open,     setOpen]     = useState(false);
  const [user,     setUser]     = useState(null);
  const [category, setCategory] = useState("");
  const [message,  setMessage]  = useState("");
  const [booking,  setBooking]  = useState(null); // { bookingId, bookingNumber, serviceName }
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(null);
  const [error,    setError]    = useState("");

  // Re-read the session on every navigation — this widget lives in the root
  // layout, which never remounts on client-side navigation, so without this
  // it keeps rendering whatever auth state was true on the very first paint
  // (e.g. still shows "sign in" right after a login redirect).
  useEffect(() => { setUser(getStoredUser()); }, [pathname]);

  // Also resync immediately on login/logout (same tab) and cross-tab changes,
  // rather than waiting for the next navigation.
  useEffect(() => {
    const resync = () => setUser(getStoredUser());
    window.addEventListener(AUTH_CHANGED_EVENT, resync);
    window.addEventListener("storage", resync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, resync);
      window.removeEventListener("storage", resync);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  // Let other pages (e.g. a booking detail page) open this widget pre-filled.
  useEffect(() => {
    const handler = (e) => {
      const { bookingId, bookingNumber, serviceName, category: cat } = e.detail || {};
      setDone(null);
      setError("");
      if (bookingId) setBooking({ bookingId, bookingNumber, serviceName });
      if (cat) setCategory(cat);
      setOpen(true);
    };
    window.addEventListener(SUPPORT_OPEN_EVENT, handler);
    return () => window.removeEventListener(SUPPORT_OPEN_EVENT, handler);
  }, []);

  // ── Early return AFTER all hooks ─────────────────────────────────────────
  // Rules of Hooks: hooks must always run in the same order; only return after them.
  const isPartner = user?.role === "provider";
  if (user?.role === "admin") return null;
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  const categories = CATEGORIES_BY_ROLE[isPartner ? "provider" : "customer"];

  // ── Handlers ─────────────────────────────────────────────────────────────
  const reset = () => { setDone(null); setCategory(""); setMessage(""); setBooking(null); setError(""); };

  const goToChat = () => {
    if (done?.ticketId) router.push(`/support/${done.ticketId}`);
    setOpen(false);
    setDone(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || message.trim().length < 10) {
      setError("Please select a category and describe your issue (min 10 characters).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/support", {
        category,
        message:   message.trim(),
        bookingId: booking?.bookingId || undefined,
      });
      if (data.success) {
        setDone({ ticketNumber: data.ticket.ticketNumber, ticketId: data.ticket._id });
        setCategory("");
        setMessage("");
        setBooking(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[1200] flex flex-col items-end gap-3 font-sans">

      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">

          {/* Panel header */}
          <div className="bg-zinc-950 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <MessageSquare size={15} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-500">EliteCrew</p>
                <p className="text-sm font-extrabold text-white">{isPartner ? "Partner Support" : "Support"}</p>
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); reset(); }}
              className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-5">

            {/* Not logged in */}
            {!user && (
              <div className="text-center py-4">
                <MessageSquare size={32} className="text-zinc-200 mx-auto mb-3" />
                <p className="font-extrabold text-zinc-900 mb-1">Get Support</p>
                <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                  Sign in to raise a support ticket and chat with our team in real time.
                </p>
                <Link href="/login" onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-full bg-black text-white px-5 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors">
                  Sign In to Continue
                </Link>
                <p className="mt-3 text-[10px] text-zinc-400">
                  No account?{" "}
                  <Link href="/register" onClick={() => setOpen(false)} className="text-black font-bold hover:underline">Register</Link>
                </p>
              </div>
            )}

            {/* Success — ticket created */}
            {user && done && (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <p className="font-extrabold text-zinc-900 mb-1">Ticket Created!</p>
                <p className="text-xs font-bold text-zinc-400 mb-1">{done.ticketNumber}</p>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                  Our support team will respond shortly. Open the chat to continue the conversation.
                </p>
                <button onClick={goToChat}
                  className="w-full bg-black text-white px-5 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                  Open Chat <MessageSquare size={12} />
                </button>
                <button onClick={reset}
                  className="mt-2 w-full border border-zinc-200 text-zinc-500 px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:border-zinc-400 hover:text-zinc-700 transition-colors">
                  New Ticket
                </button>
              </div>
            )}

            {/* Create ticket form */}
            {user && !done && (
              <>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Hi <strong className="text-zinc-800">{user.fullName?.split(" ")[0]}</strong>!
                  {" "}Describe your issue and we&apos;ll get back to you in real time.
                </p>

                {booking && (
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 mb-3">
                    <Link2 size={12} className="text-zinc-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-zinc-700 truncate">
                        {booking.bookingNumber || "Linked booking"}
                      </p>
                      {booking.serviceName && (
                        <p className="text-[10px] text-zinc-400 truncate">{booking.serviceName}</p>
                      )}
                    </div>
                    <button type="button" onClick={() => setBooking(null)}
                      className="text-zinc-300 hover:text-zinc-600 shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={e => { setCategory(e.target.value); setError(""); }}
                      className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors rounded-xl"
                    >
                      <option value="">Select issue type…</option>
                      {categories.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                      Describe your issue *
                    </label>
                    <textarea
                      rows={4}
                      placeholder={isPartner
                        ? "e.g. The customer wasn't available at the address and I couldn't reach them…"
                        : "e.g. My provider didn't arrive and I've had no update…"}
                      value={message}
                      onChange={e => { setMessage(e.target.value); setError(""); }}
                      className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors resize-none rounded-xl placeholder:text-zinc-300"
                    />
                    <p className={`text-[10px] font-medium mt-0.5 text-right ${
                      message.length > 0 && message.length < 10 ? "text-amber-500" : "text-zinc-300"
                    }`}>
                      {message.length} / 2000
                    </p>
                  </div>

                  {error && (
                    <p className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !category || message.trim().length < 10}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:opacity-50 rounded-xl"
                  >
                    {loading
                      ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                      : <><Send size={13} /> Send Message</>}
                  </button>
                </form>

                <div className="mt-3 pt-3 border-t border-zinc-100 text-center">
                  <Link href="/support" onClick={() => setOpen(false)}
                    className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-black transition-colors">
                    View all my tickets →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Floating toggle button ──────────────────────────────────────────── */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) reset(); }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          open
            ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            : "bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-900/50"
        }`}
        aria-label="Support"
        title="Get Support"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
}
