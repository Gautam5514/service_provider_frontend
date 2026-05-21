"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { formatPrice } from "@/lib/services";
import {
  AlertTriangle, ArrowRight, BellRing, CalendarClock,
  CheckCircle2, ChevronDown, ChevronUp, ClipboardList,
  CreditCard, IndianRupee, MapPin, RefreshCw,
  UserRound, Wrench, Zap, X,
} from "lucide-react";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:         { label:"New Job",     bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",   dot:"bg-amber-400 animate-pulse" },
  accepted:        { label:"Accepted",    bg:"bg-blue-50",    text:"text-blue-700",    border:"border-blue-200",    dot:"bg-blue-500"    },
  provider_on_way: { label:"On The Way",  bg:"bg-violet-50",  text:"text-violet-700",  border:"border-violet-200",  dot:"bg-violet-500"  },
  in_progress:     { label:"In Progress", bg:"bg-orange-50",  text:"text-orange-700",  border:"border-orange-200",  dot:"bg-orange-400 animate-pulse" },
  completed:       { label:"Completed",   bg:"bg-emerald-50", text:"text-emerald-700", border:"border-emerald-200", dot:"bg-emerald-500" },
  cancelled:       { label:"Cancelled",   bg:"bg-zinc-100",   text:"text-zinc-500",    border:"border-zinc-200",    dot:"bg-zinc-400"    },
};

const MY_TABS = [
  { key:"all",       label:"All"       },
  { key:"active",    label:"Active"    },
  { key:"pending",   label:"Incoming"  },
  { key:"completed", label:"Completed" },
];

function isActive(s) { return ["accepted","provider_on_way","in_progress"].includes(s); }

function fmtDate(d, slot) {
  const date = new Date(d).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
  if (!slot) return date;
  const time = new Date(`2000-01-01T${slot}`).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
  return `${date} · ${time}`;
}

// ─── My-jobs card (links to detail page on click) ──────────────────────────────
function MyJobCard({ job }) {
  const st = STATUS_CONFIG[job.status] || STATUS_CONFIG.cancelled;
  return (
    <Link href={`/dashboard/provider/orders/${job._id}`}>
      <div className={`group bg-white rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden cursor-pointer ${
        job.status === "pending"
          ? "border-amber-200 hover:border-amber-300 shadow-sm shadow-amber-50"
          : "border-zinc-100 hover:border-zinc-300"
      }`}>
        {job.status === "pending" && <div className="h-0.5 bg-amber-400 w-full" />}
        {isActive(job.status)     && <div className="h-0.5 bg-blue-500 w-full" />}

        <div className="p-5 flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-200">
            <Wrench size={18} strokeWidth={1.8} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-bold text-zinc-900 text-sm">{job.serviceName}</span>
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mb-0.5">
              <CalendarClock size={11} />
              {fmtDate(job.scheduledDate, job.scheduledTimeSlot)}
            </p>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mb-0.5 truncate">
              <MapPin size={11} />
              {job.address?.city || job.address?.text || "—"}
            </p>
            {job.customerId?.fullName && (
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <UserRound size={11} /> {job.customerId.fullName}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 flex flex-col items-end justify-between">
            <div className="text-right">
              <p className="text-base font-black text-zinc-900">{formatPrice(job.pricing?.totalAmount || 0)}</p>
              <p className="text-[9px] text-zinc-300 mt-0.5">{job.bookingNumber}</p>
            </div>
            <span className="flex items-center gap-1 mt-2 text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors">
              Open <ArrowRight size={10} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Pool card — expandable confirm UX ────────────────────────────────────────
// Clicking "Confirm Job" expands the card showing full details + payout.
// "Claim This Job" → API call → router.push to job detail (no extra steps).
function PoolJobCard({ job, onClaimed }) {
  const [expanded, setExpanded] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [err,      setErr]      = useState("");

  const basePrice  = job.pricing?.basePrice   || 0;
  const platFee    = job.pricing?.platformFee  || 0;
  const tax        = job.pricing?.tax          || 0;
  const myPayout   = Math.max(0, basePrice - platFee - tax);

  const handleClaim = async () => {
    setClaiming(true);
    setErr("");
    try {
      const { data } = await api.put(`/bookings/${job._id}/pickup`);
      if (data.success) onClaimed(job._id);
    } catch (e) {
      setErr(e.response?.data?.message || "Could not claim this job. It may already be taken.");
      setClaiming(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
      expanded ? "border-zinc-300 shadow-lg" : "border-zinc-100 hover:border-zinc-300"
    }`}>
      {/* ── Collapsed row ──────────────────────────────────────────────── */}
      <div className="p-5 flex gap-4">
        <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0">
          <Wrench size={18} strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-bold text-zinc-900 text-sm">{job.serviceName}</span>
            <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              Available
            </span>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 mb-0.5">
            <CalendarClock size={11} />
            {fmtDate(job.scheduledDate, job.scheduledTimeSlot)}
          </p>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 truncate">
            <MapPin size={11} />
            {job.address?.city || job.address?.text || "—"}
            {job.matchDistanceKm != null ? ` · ${job.matchDistanceKm} km away` : ""}
          </p>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end justify-between gap-2">
          <div className="text-right">
            <p className="text-base font-black text-zinc-900">{formatPrice(job.pricing?.totalAmount || 0)}</p>
            <p className="text-[9px] text-zinc-300 mt-0.5">{job.bookingNumber}</p>
          </div>
          {/* Toggle — show details before committing */}
          <button
            onClick={() => { setExpanded(v => !v); setErr(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-full transition-all duration-200 ${
              expanded
                ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                : "bg-zinc-900 text-white hover:bg-black"
            }`}
          >
            {expanded ? <><X size={11} /> Close</> : <>Confirm Job <ChevronDown size={11} /></>}
          </button>
        </div>
      </div>

      {/* ── Expanded detail + final claim ────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-zinc-100 px-5 pb-5 pt-4 space-y-4">

          {/* Full details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2.5">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400">Job Details</p>
              <div className="space-y-1.5 text-xs text-zinc-600">
                <p className="flex items-center gap-2">
                  <CalendarClock size={12} className="text-zinc-400 shrink-0" />
                  {fmtDate(job.scheduledDate, job.scheduledTimeSlot)}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>{[job.address?.text, job.address?.city, job.address?.pincode].filter(Boolean).join(", ")}</span>
                </p>
                {job.matchDistanceKm != null && (
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-400 shrink-0">📍</span>
                    <span className="font-semibold text-blue-600">{job.matchDistanceKm} km from you</span>
                  </p>
                )}
                {job.serviceCategory && (
                  <p className="flex items-center gap-2">
                    <Wrench size={12} className="text-zinc-400 shrink-0" />
                    <span className="capitalize">{job.serviceCategory} services</span>
                  </p>
                )}
              </div>
            </div>

            {/* Payout breakdown */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-emerald-700 mb-2.5">Your Earnings</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Base price</span>
                  <span className="font-semibold">{formatPrice(basePrice)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Platform fee</span>
                  <span>−{formatPrice(platFee)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Tax</span>
                  <span>−{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200 mt-1">
                  <span className="font-extrabold text-emerald-900">Your payout</span>
                  <span className="font-black text-lg text-emerald-700 leading-none">{formatPrice(myPayout)}</span>
                </div>
              </div>
              <p className="text-[9px] text-emerald-600 font-medium mt-2">
                Paid to you in cash by the customer on completion.
              </p>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl">
              <AlertTriangle size={14} className="shrink-0 mt-px" />
              {err}
            </div>
          )}

          {/* Final action */}
          <div className="flex gap-3">
            <button
              onClick={() => { setExpanded(false); setErr(""); }}
              className="px-5 py-3 border border-zinc-200 text-zinc-500 text-[10px] font-bold tracking-widest uppercase rounded-xl hover:border-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 text-[11px] font-extrabold tracking-widest uppercase rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-lg shadow-emerald-200"
            >
              {claiming
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Claiming…</>
                : <><CheckCircle2 size={15} /> Claim This Job</>}
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 text-center font-medium">
            First to claim wins — you'll be taken directly to the job details.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProviderOrdersPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initialView  = searchParams.get("view") === "pool" ? "pool" : "my";

  const [view,        setView]        = useState(initialView);
  const [myJobs,      setMyJobs]      = useState([]);
  const [poolJobs,    setPoolJobs]    = useState([]);
  const [poolMsg,     setPoolMsg]     = useState("");
  const [loadingMy,   setLoadingMy]   = useState(true);
  const [loadingPool, setLoadingPool] = useState(false);
  const [myTab,       setMyTab]       = useState("all");

  const loadMyJobs = useCallback(async () => {
    setLoadingMy(true);
    try {
      const { data } = await api.get("/bookings/provider/jobs");
      if (data.success) setMyJobs(data.jobs || []);
    } catch (e) { console.error(e); }
    finally { setLoadingMy(false); }
  }, []);

  const loadPool = useCallback(async () => {
    setLoadingPool(true);
    setPoolMsg("");
    try {
      const { data } = await api.get("/bookings/provider/available");
      if (data.success) {
        setPoolJobs(data.jobs || []);
        if (data.message) setPoolMsg(data.message);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingPool(false); }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => { loadMyJobs(); loadPool(); }, 0);
    const iv = setInterval(() => { loadMyJobs(); loadPool(); }, 20000);
    return () => { clearTimeout(id); clearInterval(iv); };
  }, [loadMyJobs, loadPool]);

  // Auto-switch to pool if provider has no jobs yet but pool has some
  useEffect(() => {
    if (loadingPool || myJobs.length > 0 || poolJobs.length === 0) return;
    const id = setTimeout(() => setView("pool"), 0);
    return () => clearTimeout(id);
  }, [loadingPool, myJobs.length, poolJobs.length]);

  // After a job is claimed → go straight to the job detail. Zero extra steps.
  const handleClaimed = (jobId) => {
    setPoolJobs(prev => prev.filter(j => j._id !== jobId));
    router.push(`/dashboard/provider/orders/${jobId}?claimed=1`);
  };

  const visibleMyJobs = myJobs.filter(j => {
    if (myTab === "pending")   return j.status === "pending";
    if (myTab === "active")    return isActive(j.status);
    if (myTab === "completed") return j.status === "completed";
    return true;
  });

  const counts = {
    all:       myJobs.length,
    pending:   myJobs.filter(j => j.status === "pending").length,
    active:    myJobs.filter(j => isActive(j.status)).length,
    completed: myJobs.filter(j => j.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] font-sans selection:bg-black selection:text-white pb-16">

      {/* ── Dark header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative px-6 md:px-12 py-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">Provider Panel</p>
              <h1 className="text-3xl font-black tracking-tight text-white">Jobs</h1>
            </div>
            <div className="flex items-center gap-3">
              {counts.pending > 0 && (
                <span className="inline-flex items-center gap-2 bg-amber-900/30 border border-amber-700/40 text-amber-300 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-full">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  {counts.pending} incoming
                </span>
              )}
              <button
                onClick={() => { loadMyJobs(); if (view === "pool") loadPool(); }}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Pool alert banner */}
          {poolJobs.length > 0 && (
            <div className="mt-6 flex items-center justify-between gap-4 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3.5">
              <div className="flex items-center gap-3">
                <BellRing size={16} className="text-emerald-400 shrink-0" />
                <p className="text-sm font-bold text-white">
                  {poolJobs.length} open job{poolJobs.length > 1 ? "s" : ""} in your area
                  <span className="text-zinc-400 font-normal text-xs ml-2">— first to confirm wins</span>
                </p>
              </div>
              <button
                onClick={() => setView("pool")}
                className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-full hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                View Pool <ArrowRight size={10} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 md:px-12 py-6 space-y-5">

        {/* ── View switcher ─────────────────────────────────────────────── */}
        <div className="flex bg-white rounded-2xl border border-zinc-100 p-1 w-fit shadow-sm">
          {[
            { key: "my",   label: "My Jobs",        count: myJobs.length   },
            { key: "pool", label: "Available Jobs",  count: poolJobs.length },
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold tracking-wide rounded-xl transition-all duration-200 ${
                view === v.key ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-700"
              }`}>
              {v.label}
              <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
                view === v.key
                  ? v.key === "pool" && v.count > 0 ? "bg-emerald-400 text-zinc-900" : "bg-white/20 text-white"
                  : v.key === "pool" && v.count > 0 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
              }`}>
                {v.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── MY JOBS ──────────────────────────────────────────────────── */}
        {view === "my" && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-white rounded-2xl border border-zinc-100 p-1 w-fit shadow-sm">
              {MY_TABS.map(t => (
                <button key={t.key} onClick={() => setMyTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all duration-200 ${
                    myTab === t.key ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                  }`}>
                  {t.label}
                  <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
                    myTab === t.key ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                  }`}>
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>

            {loadingMy && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-zinc-100 h-24 animate-pulse" />
                ))}
              </div>
            )}

            {!loadingMy && visibleMyJobs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-zinc-200">
                <ClipboardList size={40} className="text-zinc-200 mb-4" />
                <p className="text-zinc-400 font-bold tracking-widests uppercase text-xs mb-2">
                  No {myTab === "all" ? "" : myTab + " "}jobs
                </p>
                <p className="text-zinc-300 text-xs mb-5 text-center max-w-xs">
                  {myTab === "all" ? "You have no assigned jobs yet." : "No jobs in this category right now."}
                </p>
                <button onClick={() => setView("pool")}
                  className="flex items-center gap-2 text-[10px] font-bold tracking-widests uppercase bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-black transition-colors">
                  Browse Available Jobs <ArrowRight size={11} />
                </button>
              </div>
            )}

            {!loadingMy && visibleMyJobs.length > 0 && (
              <div className="space-y-3">
                {visibleMyJobs.map(job => <MyJobCard key={job._id} job={job} />)}
              </div>
            )}
          </>
        )}

        {/* ── AVAILABLE JOBS POOL ───────────────────────────────────────── */}
        {view === "pool" && (
          <>
            {/* How it works */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-start gap-3 shadow-sm">
              <Zap size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-zinc-900 mb-0.5">How the job pool works</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Open customer bookings broadcast to every matching provider near the service location.
                  First provider to confirm gets the job. Click <strong className="text-zinc-600">Confirm Job</strong> to see full details and payout before claiming.
                </p>
              </div>
            </div>

            {loadingPool && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-zinc-100 h-24 animate-pulse" />
                ))}
              </div>
            )}

            {!loadingPool && poolMsg && poolJobs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertTriangle size={40} className="text-amber-400 mb-4" />
                <p className="text-amber-700 font-bold text-sm mb-2 text-center">{poolMsg}</p>
                <p className="text-amber-600 text-xs text-center max-w-sm">
                  Check your profile city, service area, location, and service categories.
                </p>
              </div>
            )}

            {!loadingPool && !poolMsg && poolJobs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-zinc-200">
                <CheckCircle2 size={40} className="text-zinc-200 mb-4" />
                <p className="text-zinc-400 font-bold tracking-widests uppercase text-xs mb-2">No open jobs right now</p>
                <p className="text-zinc-300 text-xs text-center max-w-xs mb-5">
                  All matching jobs have been claimed. Refreshes every 20 seconds.
                </p>
                <button onClick={loadPool}
                  className="flex items-center gap-2 text-[10px] font-bold tracking-widests uppercase bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-black transition-colors">
                  <RefreshCw size={11} /> Refresh Pool
                </button>
              </div>
            )}

            {!loadingPool && poolJobs.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-widests uppercase text-zinc-400">
                  {poolJobs.length} open job{poolJobs.length !== 1 ? "s" : ""} matching your profile
                </p>
                {poolJobs.map(job => (
                  <PoolJobCard key={job._id} job={job} onClaimed={handleClaimed} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
