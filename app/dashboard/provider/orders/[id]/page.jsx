"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { CATEGORY_META, formatPrice, providerPayout } from "@/lib/services";
import {
  ArrowLeft, CalendarClock, MapPin, UserRound, Wrench, CheckCircle2,
  AlertTriangle, Navigation, LockKeyhole, Phone, CreditCard, ClipboardList,
  Radio, StopCircle,
} from "lucide-react";

// Load the map client-side only
const LiveTrackingMap = dynamic(
  () => import("@/components/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[340px] rounded-lg bg-zinc-100 animate-pulse flex items-center justify-center border border-zinc-200">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading map…</p>
      </div>
    ),
  }
);

const STATUS_CONFIG = {
  pending:         { label: "New Job",          bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400 animate-pulse" },
  accepted:        { label: "Accepted",         bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500" },
  provider_on_way: { label: "On The Way",       bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  dot: "bg-violet-500" },
  in_progress:     { label: "In Progress",      bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-400 animate-pulse" },
  completed:       { label: "Completed",        bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  cancelled:       { label: "Cancelled",        bg: "bg-zinc-100",   text: "text-zinc-500",    border: "border-zinc-200",    dot: "bg-zinc-400" },
};

// Reasons a provider can give when releasing a job they can't complete.
const RELEASE_REASONS = [
  "Personal emergency",
  "Feeling unwell",
  "Vehicle / travel problem",
  "Don't have the required tools or parts",
  "Customer not reachable",
  "Job is outside my area",
  "Other reason",
];

export default function ProviderOrderDetailPage({ params }) {
  const { id }       = use(params);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const justClaimed  = searchParams.get("claimed") === "1"; // came here straight from pool confirm

  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [otp,     setOtp]     = useState("");
  const [toast,   setToast]   = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject,   setShowReject]   = useState(false);
  const [releaseReason, setReleaseReason] = useState("");
  const [showRelease,   setShowRelease]   = useState(false);

  // ── GPS location sharing ──────────────────────────────────────────────────
  const [isSharing,  setIsSharing]  = useState(false);
  const [currentLoc, setCurrentLoc] = useState(null); // { lat, lng }
  const watchIdRef  = useRef(null);
  const lastSentRef = useRef(0);
  const SEND_INTERVAL_MS = 15_000; // send every 15 s at most

  const startSharing = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported on this device.", false);
      return;
    }
    let firstSend = true;
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentLoc({ lat, lng });
        const now = Date.now();
        if (firstSend || now - lastSentRef.current >= SEND_INTERVAL_MS) {
          firstSend = false;
          lastSentRef.current = now;
          api.put(`/bookings/${id}/location`, { lat, lng }).catch(() => {});
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        showToast("Could not get your location. Check browser GPS permissions.", false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 8_000 }
    );
    watchIdRef.current = wid;
    setIsSharing(true);
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  };

  // Stop watching on unmount
  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(({ data }) => { if (data.success) setJob(data.booking); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const action = async (endpoint, body = {}) => {
    setActing(true);
    try {
      const { data } = await api.put(`/bookings/${id}/${endpoint}`, body);
      if (data.success) {
        setJob(data.booking);
        showToast(data.message || "Updated successfully");
        if (endpoint === "reject" || endpoint === "provider-cancel") router.push("/dashboard/provider/orders");
      }
    } catch (e) {
      showToast(e.response?.data?.message || "Action failed", false);
    } finally { setActing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">Loading Job…</p>
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-[#f7f7f8] p-10 flex flex-col items-center justify-center">
      <ClipboardList size={40} className="text-zinc-300 mb-4" />
      <p className="text-zinc-400 font-bold tracking-widest uppercase text-sm mb-4">Job not found</p>
      <Link href="/dashboard/provider/orders"
        className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase bg-zinc-900 text-white px-5 py-2.5 rounded-md hover:bg-black transition-colors">
        <ArrowLeft size={11} /> Back to Jobs
      </Link>
    </div>
  );

  const st   = STATUS_CONFIG[job.status] || STATUS_CONFIG.cancelled;
  const meta = CATEGORY_META[job.serviceCategory];
  const date = new Date(job.scheduledDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const slot = job.scheduledTimeSlot
    ? new Date(`2000-01-01T${job.scheduledTimeSlot}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "";

  return (
    <div className="min-h-screen bg-[#f7f7f8] font-sans selection:bg-black selection:text-white pb-16">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase shadow-lg rounded-md border ${
          toast.ok ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-red-200 text-red-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── Dark Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white pb-16 pt-8">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"32px 32px"}} />
               <div className="relative px-6 md:px-10 lg:px-12 w-full max-w-[1600px] mx-auto">
          <Link href="/dashboard/provider/orders"
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Jobs
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                {meta ? <meta.icon size={26} className="text-zinc-100" /> : <Wrench size={26} className="text-zinc-100" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <span className={`inline-flex items-center gap-1 text-[8px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-md border ${st.bg} ${st.text} ${st.border}`}>
                    <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                    {job.bookingNumber}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">{job.serviceName}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Container (Widescreen Bento Grid) ── */}
      <div className="px-6 md:px-10 lg:px-12 -mt-10 w-full max-w-[1600px] mx-auto relative z-10 space-y-6">
        
        {/* ── "Just claimed" success banner ── */}
        {justClaimed && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200/60 rounded-lg px-6 py-5 shadow-[0_4px_20px_rgba(16,185,129,0.08)] animate-reveal-down">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-emerald-950">Job claimed successfully!</p>
              <p className="text-xs text-emerald-700 mt-1 font-semibold">
                This job is now yours. When you&apos;re ready to head out, tap <strong className="font-extrabold text-emerald-900">Start Travel</strong> below to notify the customer.
              </p>
            </div>
          </div>
        )}

        {/* Sub-Card 1: Status & Real-Time Actions */}
        <div>
          {/* Pending Action Card */}
          {job.status === "pending" && (
            <div className="bg-white rounded-lg border border-zinc-200/80 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-600 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Action Required</span>
                </div>
                <p className="text-lg font-black text-zinc-950">Pending Acceptance</p>
                <p className="text-xs text-zinc-500 font-semibold max-w-xl">
                  Please accept or reject this request soon. Pending requests are auto-reassigned to other providers if ignored.
                </p>
              </div>

              {!showReject ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                  <button onClick={() => action("accept")} disabled={acting}
                    className="sm:w-44 bg-zinc-950 text-white py-3 px-5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-black active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircle2 size={14} /> {acting ? "Processing…" : "Accept Request"}
                  </button>
                  <button onClick={() => setShowReject(true)}
                    className="sm:w-40 bg-white border border-zinc-200 text-red-600 py-3 px-5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all duration-150">
                    Reject Request
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4 w-full md:max-w-md">
                  <label className="block text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-2">Reason for rejection (optional)</label>
                  <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Not available, too far, etc."
                    className="w-full border border-zinc-200 rounded-md bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 resize-none mb-3 transition-colors" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => action("reject", { reason: rejectReason })} disabled={acting}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50">
                      {acting ? "Processing…" : "Confirm Rejection"}
                    </button>
                    <button onClick={() => setShowReject(false)}
                      className="sm:w-24 bg-zinc-150 text-zinc-600 py-2.5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 active:scale-95 transition-all duration-150">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* On The Way Action Card */}
          {job.status === "accepted" && (
            <div className="bg-white rounded-lg border border-zinc-200/80 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-600 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Job Accepted</span>
                </div>
                <p className="text-lg font-black text-zinc-950">Ready to Depart</p>
                <p className="text-xs text-zinc-500 font-semibold max-w-xl">
                  Ready to depart for the job location? Stream your live coordinates to let the customer track your journey.
                </p>
              </div>
              <button onClick={() => action("on-way")} disabled={acting}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-blue-600 text-white px-6 py-3.5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-200 disabled:opacity-50 flex-shrink-0 shadow-md">
                <Navigation size={14} className="rotate-45" /> {acting ? "Initializing…" : "Start Travel"}
              </button>
            </div>
          )}

          {/* Release Job — provider accepted but can't do it (any stage before completion) */}
          {["accepted", "provider_on_way", "in_progress"].includes(job.status) && (
            <div className="mt-4">
              {!showRelease ? (
                <button onClick={() => setShowRelease(true)}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors">
                  <AlertTriangle size={13} /> Can&apos;t do this job?
                </button>
              ) : (
                <div className="bg-white rounded-lg border border-red-200 p-5 shadow-sm max-w-xl">
                  <p className="text-sm font-black text-zinc-950">Release this job?</p>
                  <p className="text-xs text-zinc-500 font-semibold mt-1 mb-3">
                    We&apos;ll assign the customer another nearby professional. Frequent releases can affect how many jobs you&apos;re offered.
                  </p>
                  <label className="block text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-2">Reason</label>
                  <select value={releaseReason} onChange={e => setReleaseReason(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md bg-white px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 mb-3 transition-colors">
                    <option value="">Select a reason…</option>
                    {RELEASE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => action("provider-cancel", { reason: releaseReason })} disabled={acting || !releaseReason}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-40">
                      {acting ? "Releasing…" : "Release Job"}
                    </button>
                    <button onClick={() => { setShowRelease(false); setReleaseReason(""); }} disabled={acting}
                      className="sm:w-28 bg-zinc-100 text-zinc-600 py-2.5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 active:scale-95 transition-all duration-150">
                      Keep Job
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completed Job Status Bar */}
          {job.status === "completed" && (
            <div className="bg-white rounded-lg border border-zinc-200/80 p-6 md:p-8 flex items-center gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                <CheckCircle2 size={24} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-50" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Settled</span>
                </div>
                <p className="text-lg font-black text-zinc-950">Job Completed Successfully</p>
                <p className="text-xs font-semibold text-zinc-500">
                  Finished on {job.completedAt ? new Date(job.completedAt).toLocaleString("en-IN") : ""}
                </p>
              </div>
            </div>
          )}

          {/* Cancelled Status Bar */}
          {job.status === "cancelled" && (
            <div className="bg-white rounded-lg border border-zinc-200/80 p-6 md:p-8 flex items-center gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-zinc-400 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Inactive</span>
                </div>
                <p className="text-lg font-black text-zinc-950">Job Cancelled</p>
                <p className="text-xs font-semibold text-zinc-500">This request was cancelled by the customer or administrator.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sub-Card 2: Location Map Tracking (If Active) */}
        {["accepted", "provider_on_way"].includes(job.status) && (
          <div className="bg-white rounded-lg border border-zinc-200/80 p-5 md:p-7 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <MapPin size={13} />
                  <span className="text-[9px] font-bold tracking-widest uppercase">Live Location Sharing</span>
                </div>
                <p className="text-base font-black text-zinc-950">
                  {isSharing ? "Broadcasting your telemetry coordinates" : "Enable sharing to help the customer navigate your arrival"}
                </p>
              </div>
              {isSharing ? (
                <button type="button" onClick={stopSharing}
                  className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-md text-[9px] font-bold tracking-widest uppercase hover:bg-red-100 transition-colors shrink-0 shadow-sm">
                  <StopCircle size={13} /> Stop Share
                </button>
              ) : (
                <button type="button" onClick={startSharing}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2.5 rounded-md text-[9px] font-bold tracking-widest uppercase hover:bg-blue-700 transition-colors shrink-0 shadow-sm">
                  <Radio size={13} className="animate-pulse" /> Share GPS
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-inner">
              <LiveTrackingMap
                providerLat={currentLoc?.lat}
                providerLng={currentLoc?.lng}
                customerLat={job.address?.lat}
                customerLng={job.address?.lng}
                providerLabel="You"
                customerLabel={job.customerId?.fullName || "Customer"}
                height="h-[300px]"
              />
            </div>
            {isSharing ? (
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Streaming live telemetry coordinate data to customer client (Interval: 15s)
              </div>
            ) : (
              <p className="text-[10px] font-semibold text-zinc-400">Your current location coordinate stream is off.</p>
            )}
          </div>
        )}

        {/* Sub-Card 3: OTP Authentication Box (If Traveling/On Way) */}
        {(job.status === "accepted" || job.status === "provider_on_way") && (
          <div className="bg-zinc-950 border border-zinc-900 text-white rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"24px 24px"}} />
            
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2">
                <LockKeyhole size={16} className="text-zinc-400 shrink-0" />
                <p className="text-base font-black tracking-tight uppercase text-zinc-400">Security Checkpoint</p>
              </div>
              <p className="text-xs text-zinc-400">Request the 4-digit security code from the customer to initialize work hours.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 z-10">
              <input
                type="text" inputMode="numeric" maxLength={4} placeholder="••••"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full sm:w-28 text-center text-2xl font-black border border-white/10 rounded-md px-3 py-2.5 focus:border-white/40 focus:outline-none bg-white/5 tracking-[0.25em] transition-all text-white placeholder-white/20"
              />
              <button onClick={() => action("start", { otp })} disabled={acting || otp.length < 4}
                className="w-full sm:w-auto bg-white text-black px-6 py-4 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:hover:bg-white shrink-0 shadow-md">
                {acting ? "Validating…" : "Confirm Start"}
              </button>
            </div>
          </div>
        )}

        {/* Sub-Card 4: Complete Job Call (If In Progress) */}
        {job.status === "in_progress" && (
          <div className="bg-white rounded-lg border border-zinc-200/80 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest uppercase">In Progress</span>
              </div>
              <p className="text-lg font-black text-orange-950">Job Active</p>
              <p className="text-xs text-zinc-500 font-semibold">Please finalize the service and collect direct cash/online payments before completion mark.</p>
            </div>
            <button onClick={() => { if (confirm("Mark this job as completed?")) action("complete"); }} disabled={acting}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-600 text-white px-6 py-3.5 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-emerald-750 transition-colors disabled:opacity-50 flex-shrink-0 shadow-sm">
              <CheckCircle2 size={14} /> {acting ? "..." : "Complete Job"}
            </button>
          </div>
        )}

        {/* Sub-Card 5: Core Information Bento Grid (Full Width Side-by-Side Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Box A: Schedule */}
          <div className="bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-[0_4px_25px_rgba(0,0,0,0.015)] rounded-lg p-5 transition-all duration-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-900 shadow-sm">
              <CalendarClock size={16} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 block">Schedule</span>
              <p className="text-sm font-extrabold text-zinc-900 leading-tight truncate">{date}</p>
              <p className="text-xs font-semibold text-zinc-500 truncate">{slot || "Flexible slot"}</p>
            </div>
          </div>

          {/* Box B: Location */}
          <div className="bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-[0_4px_25px_rgba(0,0,0,0.015)] rounded-lg p-5 transition-all duration-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-900 shadow-sm">
              <MapPin size={16} />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 block">Location</span>
              <p className="text-sm font-extrabold text-zinc-900 leading-tight truncate" title={job.address?.city}>{job.address?.city || "No City"}</p>
              <p className="text-xs font-semibold text-zinc-500 line-clamp-1 truncate" title={job.address?.text}>{job.address?.text || "No address detail"}</p>
            </div>
          </div>

          {/* Box C: Payment Type */}
          <div className="bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-[0_4px_25px_rgba(0,0,0,0.015)] rounded-lg p-5 transition-all duration-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-900 shadow-sm">
              <CreditCard size={16} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 block">Payment</span>
              <p className="text-sm font-extrabold text-zinc-900 leading-tight truncate">
                {job.paymentMethod === "cash_on_delivery" ? "Cash On Delivery" : "Online Settlement"}
              </p>
              <p className="text-xs font-semibold text-zinc-500">Subject to status</p>
            </div>
          </div>

          {/* Box D: Customer details */}
          <div className="bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-[0_4px_25px_rgba(0,0,0,0.015)] rounded-lg p-5 transition-all duration-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-900 shadow-sm">
              <UserRound size={16} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 block">Customer</span>
              <p className="text-sm font-extrabold text-zinc-900 leading-tight truncate">{job.customerId?.fullName || "Guest User"}</p>
              {job.customerId?.phone ? (
                <a href={`tel:${job.customerId.phone}`} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mt-0.5">
                  <Phone size={10} /> {job.customerId.phone}
                </a>
              ) : (
                <p className="text-xs font-semibold text-zinc-500">No phone provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Card 6: Bottom Section - Note & Financials Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Left: Customer Notes / Extra Instructions */}
          <div className="bg-white border border-zinc-200/80 rounded-lg p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-zinc-400 mb-4 border-b border-zinc-100 pb-3">
                <ClipboardList size={15} />
                <span className="text-[9px] font-bold tracking-widest uppercase">Special Instructions</span>
              </div>
              {job.customerNote ? (
                <blockquote className="border-l-2 border-zinc-300 pl-3.5 py-1.5 text-xs font-semibold text-zinc-600 italic leading-relaxed">
                  &ldquo;{job.customerNote}&rdquo;
                </blockquote>
              ) : (
                <p className="text-xs font-semibold text-zinc-400 italic">No notes or custom guidelines left by customer.</p>
              )}
            </div>
            {job.paymentMethod === "cash_on_delivery" && (
              <div className="mt-8 p-4 rounded-md bg-blue-50/60 border border-blue-100 text-xs font-semibold text-blue-700 leading-relaxed">
                💸 <strong className="font-extrabold">COD collection:</strong> Collect the outstanding amount in cash directly at location before checkout completion.
              </div>
            )}
          </div>

          {/* Right: Premium Financial Settlement Block */}
          <div className="bg-zinc-950 text-white rounded-lg p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"24px 24px"}} />
            
            <p className="text-[9px] font-bold tracking-widest uppercase text-white/50 mb-5 pb-3 border-b border-white/10">Financial Settlement</p>
            <div className="space-y-4 relative z-10">
              {/* Provider only sees their take-home — no fee/tax breakdown. */}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="text-xs font-black tracking-widest uppercase text-white/50 block">Your Earning</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Immediate settlement</span>
                </div>
                <span className="text-2xl font-black text-emerald-400">
                  {formatPrice(providerPayout(job.pricing))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
