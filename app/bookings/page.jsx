"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { CATEGORY_META, formatPrice } from "@/lib/services";
import SmartSearch from "@/components/SmartSearch";
import {
  ArrowLeft, Calendar, ChevronRight, Clock, Home,
  MapPin, Plus, Search, UserRound, Wrench,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:          { label: "Finding Provider", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200/70",   dot: "bg-amber-500"   },
  accepted:         { label: "Confirmed",        bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200/70",    dot: "bg-blue-500"    },
  provider_on_way:  { label: "On The Way",       bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200/70",  dot: "bg-violet-500 animate-pulse" },
  in_progress:      { label: "In Progress",      bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200/70",  dot: "bg-orange-500 animate-pulse" },
  completed:        { label: "Completed",        bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/70", dot: "bg-emerald-500" },
  cancelled:        { label: "Cancelled",        bg: "bg-zinc-100",   text: "text-zinc-500",    border: "border-zinc-200",       dot: "bg-zinc-400"    },
  disputed:         { label: "Disputed",         bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200/70",     dot: "bg-red-500"     },
};

const TABS = [
  { key: "all",      label: "All"        },
  { key: "active",   label: "Active"     },
  { key: "completed",label: "Completed"  },
  { key: "cancelled",label: "Cancelled"  },
];

function isActive(status) { return ["pending","accepted","provider_on_way","in_progress"].includes(status); }

// Group an ordered booking list into [{ key: "July 2026", items: [...] }, …],
// preserving the API's sort order.
function groupByMonth(list) {
  const groups = [];
  const index  = new Map();
  for (const b of list) {
    const d   = new Date(b.scheduledDate);
    const key = isNaN(d) ? "Unscheduled" : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({ key, items: [] });
    }
    groups[index.get(key)].items.push(b);
  }
  return groups;
}

function BookingCard({ booking: b }) {
  const st   = STATUS_CONFIG[b.status] || STATUS_CONFIG.cancelled;
  const meta = CATEGORY_META[b.serviceCategory];
  const Icon = meta?.icon || Wrench;
  const scheduledDate = new Date(b.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const slotLabel = b.scheduledTimeSlot
    ? new Date(`2000-01-01T${b.scheduledTimeSlot}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "";
  const muted = ["cancelled", "disputed"].includes(b.status);

  return (
    <Link href={`/bookings/${b._id}`}
      className="group block bg-white rounded-2xl border border-zinc-200/80 p-5 transition-all duration-300 hover:border-zinc-300 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.25)] hover:-translate-y-px">
      <div className="flex items-start gap-4">

        {/* Category icon */}
        <div className={`hidden sm:flex w-11 h-11 rounded-xl items-center justify-center shrink-0 border transition-colors ${
          muted ? "bg-zinc-50 border-zinc-100" : "bg-zinc-50 border-zinc-100 group-hover:bg-zinc-950 group-hover:border-zinc-950"
        }`}>
          <Icon size={18} strokeWidth={1.8}
            className={muted ? "text-zinc-300" : "text-zinc-500 group-hover:text-white transition-colors"} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-[3px] rounded-full border ${st.bg} ${st.text} ${st.border}`}>
              <span className={`w-1 h-1 rounded-full ${st.dot}`} />
              {st.label}
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-zinc-300">{b.bookingNumber}</span>
          </div>

          <h3 className={`text-[15px] font-extrabold tracking-tight truncate mb-1.5 ${muted ? "text-zinc-400" : "text-zinc-900"}`}>
            {b.serviceName}
          </h3>

          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap">
              <Calendar size={12.5} className="shrink-0" /> {scheduledDate}
            </span>
            {slotLabel && (
              <span className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap">
                <Clock size={12.5} className="shrink-0" /> {slotLabel}
              </span>
            )}
            {b.address?.text && (
              <span className="inline-flex items-center gap-1.5 font-medium min-w-0 max-w-[240px] md:max-w-xs">
                <MapPin size={12.5} className="shrink-0" />
                <span className="truncate">{b.address.text}</span>
              </span>
            )}
          </div>
        </div>

        {/* Price + affordance */}
        <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-2">
          <p className={`text-base md:text-lg font-black tracking-tight tabular-nums ${muted ? "text-zinc-400" : "text-zinc-900"}`}>
            {formatPrice(b.pricing?.totalAmount || 0)}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase text-zinc-300 group-hover:text-zinc-900 transition-colors mt-2">
            <span className="hidden md:inline">Details</span>
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MyBookingsPage() {
  const router  = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [tab,      setTab]      = useState("all");

  const load = useCallback(async () => {
    const user = getStoredUser();
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "customer") { router.replace("/dashboard/provider"); return; }
    setLoading(true); setError(false);
    try {
      const { data } = await api.get("/bookings/my");
      if (data.success) setBookings(data.bookings || []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  const visible = bookings.filter(b => {
    if (tab === "active")    return isActive(b.status);
    if (tab === "completed") return b.status === "completed";
    if (tab === "cancelled") return ["cancelled","disputed"].includes(b.status);
    return true;
  });

  const counts = {
    all:       bookings.length,
    active:    bookings.filter(b => isActive(b.status)).length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => ["cancelled","disputed"].includes(b.status)).length,
  };

  const groups = groupByMonth(visible);

  return (
    <div className="min-h-screen bg-[#f7f7f8] font-sans selection:bg-black selection:text-white pb-16 sm:pb-0">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-5 min-h-16 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-400 hover:text-black transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo-transparent.png"
                alt="EliteCrew"
                className="w-6 h-6 object-contain"
              />
              <span className="text-base font-extrabold tracking-tight text-black">
                Elite<span className="font-light text-zinc-500">Crew</span>
              </span>
            </Link>
            <span className="hidden sm:inline text-zinc-200">|</span>
            <span className="hidden sm:block text-[10px] font-bold tracking-widest uppercase text-zinc-500">My Bookings</span>
          </div>
          <SmartSearch role="customer" compact className="sm:ml-auto w-full sm:flex-1" />
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="bg-zinc-950 text-white pb-16 pt-10 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-emerald-500/[0.07] blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-zinc-500 mb-2">Order History</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">My Bookings</h1>
            {!loading && !error && (
              <p className="text-[13px] text-zinc-500 mt-2">
                {counts.all} booking{counts.all !== 1 ? "s" : ""}
                {counts.active > 0 && <> · <span className="text-emerald-400 font-semibold">{counts.active} active</span></>}
              </p>
            )}
          </div>
          <Link href="/"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors shadow-xl">
            <Plus size={13} strokeWidth={2.5} /> Book Service
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 pb-16">

        {/* ── Floating tabs ── */}
        <div className="-mt-7 relative z-20 mb-8">
          <div className="bg-white p-1.5 rounded-2xl border border-zinc-200/80 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)] flex overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  tab === t.key ? "bg-zinc-950 text-white shadow-md" : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                }`}>
                {t.label}
                <span className={`min-w-[20px] px-1.5 py-0.5 rounded-full text-[9px] tabular-nums ${
                  tab === t.key ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {counts[t.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="text-center py-20 bg-white border border-red-100 rounded-2xl">
            <p className="text-red-500 font-bold tracking-widest uppercase text-xs mb-4">Failed to load bookings</p>
            <button onClick={load}
              className="bg-zinc-950 text-white px-6 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors rounded-xl">
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200/70 rounded-2xl p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:block w-11 h-11 rounded-xl bg-zinc-100 shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-28 bg-zinc-100 rounded-full" />
                    <div className="h-4 w-2/3 bg-zinc-100 rounded-full" />
                    <div className="h-3 w-1/2 bg-zinc-50 rounded-full" />
                  </div>
                  <div className="h-5 w-16 bg-zinc-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-zinc-300 rounded-2xl text-center px-6">
            <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={22} className="text-zinc-300" />
            </div>
            <p className="text-sm font-extrabold text-zinc-800 mb-1">
              {tab === "all" ? "No bookings yet" : `No ${tab} bookings`}
            </p>
            <p className="text-xs text-zinc-400 mb-6 max-w-[260px]">
              {tab === "all"
                ? "Book your first service — a verified professional will be at your door in no time."
                : "Nothing here right now. Check the other tabs or book a new service."}
            </p>
            <Link href="/"
              className="bg-zinc-950 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-md">
              Browse Services
            </Link>
          </div>
        )}

        {/* ── Grouped list ── */}
        {!loading && !error && visible.length > 0 && (
          <div className="space-y-8">
            {groups.map(group => (
              <section key={group.key}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 shrink-0">{group.key}</h2>
                  <div className="h-px flex-1 bg-zinc-200/70" />
                  <span className="text-[10px] font-semibold text-zinc-300 tabular-nums shrink-0">
                    {group.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map(b => <BookingCard key={b._id} booking={b} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200">
        <div className="flex items-center justify-around h-16 px-2">
          <Link href="/" className="flex flex-col items-center gap-1 flex-1 py-2 text-zinc-400 hover:text-black transition-colors">
            <Home size={19} strokeWidth={1.8} />
            <span className="text-[9px] font-bold tracking-wide">Home</span>
          </Link>
          <Link href="/services/ac" className="flex flex-col items-center gap-1 flex-1 py-2 text-zinc-400 hover:text-black transition-colors">
            <Search size={19} strokeWidth={1.8} />
            <span className="text-[9px] font-bold tracking-wide">Browse</span>
          </Link>
          <Link href="/bookings" className="flex flex-col items-center gap-1 flex-1 py-2 text-black transition-colors">
            <Calendar size={19} strokeWidth={2.3} />
            <span className="text-[9px] font-bold tracking-wide">Bookings</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 flex-1 py-2 text-zinc-400 hover:text-black transition-colors">
            <UserRound size={19} strokeWidth={1.8} />
            <span className="text-[9px] font-bold tracking-wide">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
