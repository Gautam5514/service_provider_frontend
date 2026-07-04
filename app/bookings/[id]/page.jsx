"use client";

import { use, useEffect, useState } from "react";
import BrandLoader from "@/components/BrandLoader";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatPrice } from "@/lib/services";
import { getSocket, ensureSocket } from "@/lib/socket";
import { loadRazorpay, openRazorpayCheckout } from "@/lib/razorpay";
import { BellRing, CheckCircle2, ClipboardList, KeyRound, MapPin, Navigation, Phone, Wrench, Calendar, CreditCard, Clock, Loader2, ShieldCheck } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import SmartSearch from "@/components/SmartSearch";

// Load the map client-side only (Leaflet requires window)
const LiveTrackingMap = dynamic(
  () => import("@/components/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] rounded-2xl bg-zinc-100 animate-pulse flex items-center justify-center border border-zinc-200">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading map…</p>
      </div>
    ),
  }
);

const STATUS_STEPS = [
  { key: "pending",         label: "Broadcasting to Providers", Icon: BellRing },
  { key: "accepted",        label: "Provider Confirmed", Icon: CheckCircle2 },
  { key: "provider_on_way", label: "On The Way", Icon: MapPin },
  { key: "in_progress",     label: "Work In Progress", Icon: Wrench },
  { key: "completed",       label: "Completed", Icon: CheckCircle2 },
];

const STATUS_CONFIG = {
  pending:          { label: "Finding Provider", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  accepted:         { label: "Confirmed",         bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  provider_on_way:  { label: "On The Way",        bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
  in_progress:      { label: "In Progress",       bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200"  },
  completed:        { label: "Completed",         bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  cancelled:        { label: "Cancelled",         bg: "bg-zinc-100",   text: "text-zinc-500",    border: "border-zinc-200"    },
  disputed:         { label: "Disputed",          bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
};

export default function BookingDetailPage({ params }) {
  const { id }        = use(params);
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const isNew         = searchParams.get("new") === "1";
  const justPaid      = searchParams.get("paid") === "1";

  const [booking,          setBooking]          = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [cancelling,       setCancelling]       = useState(false);
  const [toast,            setToast]            = useState(
    justPaid ? { msg: "Payment successful! 🎉", ok: true }
    : isNew   ? { msg: "Booking confirmed! 🎉", ok: true }
    : null
  );
  const [paying,           setPaying]           = useState(false);
  const [providerLocation, setProviderLocation] = useState(null);
  const [showDispute,      setShowDispute]      = useState(false);
  const [disputeForm,      setDisputeForm]      = useState({ reason: "", description: "" });
  const [disputeLoading,   setDisputeLoading]   = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace("/login"); return; }
    const loadBooking = () => {
      api.get(`/bookings/${id}`)
        .then(({ data }) => {
          if (data.success) {
            setBooking(data.booking);
            // Seed from persisted last-known location on first load
            const loc = data.booking?.providerCurrentLocation;
            if (loc?.lat && loc?.lng) {
              setProviderLocation(prev => prev ?? { lat: loc.lat, lng: loc.lng });
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    loadBooking();
    const interval = setInterval(loadBooking, 10000);
    return () => clearInterval(interval);
  }, [id, router]);

  // Live provider location via Socket.io
  useEffect(() => {
    let mounted = true;
    let bound   = null;

    async function setup() {
      const s = getSocket() || await ensureSocket();
      if (!s || !mounted) return;

      const handler = (data) => {
        if (String(data.bookingId) === String(id)) {
          setProviderLocation({ lat: data.lat, lng: data.lng });
        }
      };
      s.on("provider:location:update", handler);
      bound = { socket: s, handler };
    }

    setup();

    return () => {
      mounted = false;
      if (bound) bound.socket.off("provider:location:update", bound.handler);
    };
  }, [id]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  // Retry / complete an online payment for a booking that isn't paid yet
  // (e.g. the customer dismissed the sheet during checkout).
  const handlePayNow = async () => {
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Couldn't load the payment window. Check your connection and try again.");

      const { data: orderData } = await api.post("/payments/order", { bookingId: id });
      if (!orderData?.success) throw new Error(orderData?.message || "Couldn't start the payment.");

      const result = await openRazorpayCheckout({
        keyId: orderData.keyId,
        order: orderData.order,
        prefill: orderData.prefill,
        name: "EliteCrew",
        description: `Booking ${orderData.booking?.number || ""}`.trim(),
      });

      if (result.status === "dismissed") { setToast({ msg: "Payment cancelled. You can pay anytime.", ok: false }); return; }
      if (result.status === "failed")    { setToast({ msg: result.error || "Payment failed. Please try again.", ok: false }); return; }

      const { data: verifyData } = await api.post("/payments/verify", {
        bookingId: id,
        razorpay_order_id:   result.payment.razorpay_order_id,
        razorpay_payment_id: result.payment.razorpay_payment_id,
        razorpay_signature:  result.payment.razorpay_signature,
      });
      if (!verifyData?.success) throw new Error(verifyData?.message || "We couldn't confirm your payment.");

      setBooking(verifyData.booking);
      setToast({ msg: "Payment successful! 🎉", ok: true });
    } catch (e) {
      setToast({ msg: e.response?.data?.message || e.message || "Payment failed. Please try again.", ok: false });
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/bookings/${id}/cancel`, { reason: "Cancelled by customer" });
      if (data.success) setBooking(data.booking);
    } catch (e) {
      setToast({ msg: e.response?.data?.message || "Could not cancel", ok: false });
    } finally { setCancelling(false); }
  };

  const handleDispute = async (e) => {
    e.preventDefault();
    if (!disputeForm.reason) return;
    setDisputeLoading(true);
    try {
      const { data } = await api.put(`/bookings/${id}/dispute`, disputeForm);
      if (data.success) {
        setBooking(data.booking);
        setShowDispute(false);
        setToast({ msg: "Dispute raised. Support will respond within 24 hours.", ok: true });
      }
    } catch (e) {
      setToast({ msg: e.response?.data?.message || "Could not raise dispute.", ok: false });
    } finally { setDisputeLoading(false); }
  };

  if (loading) return <BrandLoader fullScreen />;

  if (!booking) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
      <div className="text-center">
        <p className="text-zinc-400 font-bold tracking-widests uppercase text-sm mb-4">Booking not found</p>
        <Link href="/bookings" className="text-black font-bold underline underline-offset-4">← My Bookings</Link>
      </div>
    </div>
  );

  const st   = STATUS_CONFIG[booking.status] || STATUS_CONFIG.cancelled;
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === booking.status);
  const isCancelled    = ["cancelled","disputed"].includes(booking.status);
  const canCancel      = ["pending","accepted"].includes(booking.status);
  const isCompleted    = booking.status === "completed";
  // Show a "Pay now" prompt when an online booking hasn't been paid yet and is
  // still live (not cancelled). COD bookings settle at completion, so skip them.
  const needsPayment   = booking.paymentMethod === "online"
                          && booking.paymentStatus === "unpaid"
                          && !isCancelled;

  const scheduledDate = new Date(booking.scheduledDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const slotLabel     = booking.scheduledTimeSlot
    ? new Date(`2000-01-01T${booking.scheduledTimeSlot}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "";

  const provider = booking.providerId;
  const providerName  = provider?.userId?.fullName;
  const providerPhone = provider?.userId?.phone;
  const customerName = booking.customerId?.fullName || "Customer";
  const customerPhone = booking.customerId?.phone;
  const addressLine = [
    booking.address?.text,
    booking.address?.city,
    booking.address?.pincode,
  ].filter(Boolean).join(", ");
  const invoiceDate = new Date(booking.completedAt || booking.updatedAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const paymentMethodLabel = booking.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : "Online Payment";
  const invoiceRows = [
    { label: booking.serviceName, note: "Professional home service", value: booking.pricing?.basePrice || 0 },
    { label: "Platform fee", note: "Booking, support and service protection", value: booking.pricing?.platformFee || 0 },
    { label: "GST", note: "Applicable taxes", value: booking.pricing?.tax || 0 },
    booking.pricing?.discount ? { label: "Discount", note: "Applied offer", value: -booking.pricing.discount } : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white pb-20 sm:pb-16">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
          #invoice { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 text-[10px] rounded-full font-bold tracking-widest uppercase shadow-2xl border ${toast.ok ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-red-200 text-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-zinc-950 border-b border-white/10 shadow-md print:hidden">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 min-h-16 py-2.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5 justify-between">
          <div className="flex w-full items-center gap-4 sm:w-auto sm:flex-1">
            <Link href="/bookings" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <img src="/logo-transparent.png" alt="EliteCrew" className="w-8 h-8 object-contain" />
            <div className="flex-1">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400">{booking.bookingNumber}</p>
              <p className="text-sm font-extrabold text-white truncate">{booking.serviceName}</p>
            </div>
            <span className={`hidden sm:inline-block text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
              {st.label}
            </span>
            <NotificationBell />
          </div>
          <SmartSearch role="customer" compact className="w-full sm:flex-1" />
        </div>
      </nav>

      {/* ── Main Content Container (Widescreen Bento Grid) ── */}
      <div className="px-6 md:px-10 lg:px-12 py-10 w-full max-w-[1600px] mx-auto space-y-6">

        {/* Pay-now banner — unpaid online booking (e.g. checkout was dismissed) */}
        {needsPayment && (
          <div className="bg-zinc-950 text-white rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 print:hidden">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <CreditCard size={20} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold">Payment pending</p>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  Complete your secure payment of {formatPrice(booking.pricing?.totalAmount || 0)} to confirm this booking.
                </p>
              </div>
            </div>
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors disabled:opacity-50 rounded-full whitespace-nowrap"
            >
              {paying && <Loader2 size={14} className="animate-spin" />}
              {paying ? "Processing…" : `Pay ${formatPrice(booking.pricing?.totalAmount || 0)}`}
            </button>
          </div>
        )}

        {/* Row 1: Split Alerts & Live GPS Tracking Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column A: Dynamic Alerts / OTP Checkpoint PIN Box (Lg: 5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between h-full min-h-[300px]">
            
            {/* OTP Banner Verification PIN Box */}
            {booking.completionOtp && !isCancelled && !isCompleted && (
              <div className="bg-zinc-950 text-white p-6 md:p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden flex-1 min-h-[220px]">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"24px 24px"}} />
                <div className="relative z-10 w-full space-y-4">
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400 mb-1.5 flex items-center gap-2">
                      <KeyRound size={12} className="text-emerald-400 animate-pulse" /> Verification PIN
                    </p>
                    <p className="text-xs text-zinc-400 font-semibold leading-relaxed">Provide this PIN to your technician to begin the service.</p>
                  </div>
                  <div className="flex gap-2.5">
                    {booking.completionOtp.split("").map((d, i) => (
                      <div key={i} className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-inner tracking-tight">
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Broadcasting Amber Card */}
            {booking.status === "pending" && (
              <div className="bg-white border border-amber-200/80 rounded-2xl p-6 flex flex-col justify-between flex-1 shadow-[0_4px_25px_rgba(245,158,11,0.02)] min-h-[220px]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                    <BellRing size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-base font-black text-amber-950 mb-1">Broadcasting Request</p>
                    <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                      We are actively notifying verified technicians in your area. This page will update automatically the moment a technician accepts your booking request.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Service Badge */}
            {isCompleted && (
              <div className="bg-white border border-emerald-200/60 rounded-2xl p-6 flex flex-col justify-between flex-1 shadow-[0_4px_25px_rgba(16,185,129,0.02)] min-h-[220px]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <p className="text-base font-black text-emerald-950 mb-1">Service Completed</p>
                    <p className="text-xs font-semibold text-emerald-700 leading-relaxed">
                      Your job has been finalized successfully. Thank you for booking with EliteCrew! You can view or print your tax invoice and rate your service provider below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancelled Banner */}
            {isCancelled && (
              <div className="bg-white border border-red-200/60 rounded-2xl p-6 flex flex-col justify-between flex-1 shadow-[0_4px_25px_rgba(239,68,68,0.02)] min-h-[220px]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <div>
                    <p className="text-base font-black text-red-950 mb-1">Booking Cancelled</p>
                    {booking.cancelReason && <p className="text-xs font-semibold text-red-700 leading-relaxed mt-1">{booking.cancelReason}</p>}
                    {booking.cancelledAt && <p className="text-[9px] font-black uppercase text-zinc-400 mt-2.5">{new Date(booking.cancelledAt).toLocaleString("en-IN")}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column B: Live Tracking Map / General Hub Badge (Lg: 7 columns) */}
          <div className="lg:col-span-7 h-full">
            {["provider_on_way", "accepted"].includes(booking.status) && booking.providerId ? (
              <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex flex-col justify-between h-full min-h-[300px]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${booking.status === "provider_on_way" ? "bg-violet-500 animate-pulse" : "bg-blue-400"}`} />
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400">
                        {booking.status === "provider_on_way" ? "Live Telemetry" : "Partner Matched"}
                      </p>
                      <p className="text-xs font-extrabold text-zinc-950 leading-tight">
                        {booking.status === "provider_on_way" ? "Your technician is travelling to your location" : "Service scheduled with provider"}
                      </p>
                    </div>
                  </div>
                  {booking.status === "provider_on_way" && providerLocation && (
                    <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full shrink-0">
                      <Navigation size={9} className="animate-pulse" /> Live
                    </span>
                  )}
                </div>

                {/* Map */}
                <div className="p-3 flex-1">
                  <LiveTrackingMap
                    providerLat={providerLocation?.lat}
                    providerLng={providerLocation?.lng}
                    customerLat={booking.address?.lat}
                    customerLng={booking.address?.lng}
                    providerLabel={booking.providerId?.userId?.fullName || "Technician"}
                    customerLabel="Your Location"
                    height="h-[230px]"
                  />
                </div>

                {/* Hint */}
                {!providerLocation && (
                  <div className="px-5 pb-3 flex items-center gap-2 text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <p className="text-[10px] font-semibold">Live GPS route will activate when location stream is shared by provider.</p>
                  </div>
                )}
              </div>
            ) : (
              /* General graphic state when map is not active */
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full shadow-[0_4px_25px_rgba(0,0,0,0.015)] min-h-[300px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none"
                  style={{backgroundImage:"linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)",backgroundSize:"20px 20px"}} />
                <div className="relative z-10 space-y-4">
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400">Dashboard Center</p>
                    <p className="text-base font-black text-zinc-950">Real-time Booking Portal</p>
                  </div>
                  <p className="text-xs text-zinc-500 font-semibold leading-relaxed max-w-md">
                    Track the live state of your scheduling request, technician dispatch coordinates, and secure financial receipt settlements under your professional profile workspace.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-100 flex items-center gap-2 z-10">
                  <span className={`inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {st.label}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-bold bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full">
                    {booking.bookingNumber}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Widescreen Bento Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Timeline Card (4 columns) */}
          {!isCancelled && (
            <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] h-full flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400 mb-6 pb-3 border-b border-zinc-100">Service Journey</p>
                <div className="space-y-0 relative">
                  <div className="absolute top-5 left-4.5 w-[1.5px] h-[calc(100%-2.5rem)] bg-zinc-100 z-0" />
                  {STATUS_STEPS.map((s, i) => {
                    const done    = currentStepIdx > i;
                    const current = currentStepIdx === i;
                    const future  = currentStepIdx < i;
                    return (
                      <div key={s.key} className="flex items-start gap-4 relative z-10 mb-6 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border transition-all duration-300 shadow-sm ${done ? "bg-zinc-950 text-white border-zinc-950" : current ? "bg-white text-zinc-950 border-[3.5px] border-zinc-950 scale-105 shadow-md ring-4 ring-zinc-950/5 animate-pulse" : "bg-white text-zinc-300 border-zinc-200"}`}>
                            {done ? <CheckCircle2 size={14} /> : <s.Icon size={14} />}
                          </div>
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className={`text-xs font-black ${future ? "text-zinc-400" : "text-zinc-950"}`}>{s.label}</p>
                          {current && (
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-zinc-50 border border-zinc-100 text-[8px] font-bold tracking-widest uppercase text-zinc-500 rounded-md">Currently Here</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] h-full flex flex-col justify-center items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-4 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <p className="text-base font-black text-zinc-950">Service Terminated</p>
              <p className="text-xs text-zinc-400 font-semibold mt-1">This booking is cancelled and is no longer active.</p>
            </div>
          )}

          {/* Column 2: Booking Bento Cells (5 columns) */}
          <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 shadow-sm shrink-0">
                  <Wrench size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-extrabold text-zinc-950 truncate leading-tight">{booking.serviceName}</p>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mt-0.5">{booking.serviceCategory} Services</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Scheduled Date", value: scheduledDate, Icon: Calendar },
                  { label: "Time Slot", value: slotLabel || "Flexible Slot", Icon: Clock },
                  { label: "Location", value: addressLine, Icon: MapPin },
                  { label: "Payment Type", value: paymentMethodLabel, Icon: CreditCard },
                  { label: "Settlement Status", value: booking.paymentStatus.replace("_", " "), Icon: CheckCircle2 },
                ].map((cell) => (
                  <div key={cell.label} className="flex items-start gap-3.5 p-3 rounded-xl border border-zinc-100/60 hover:border-zinc-200/80 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-800 shadow-sm">
                      <cell.Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-bold tracking-widest uppercase text-zinc-400 block mb-0.5">{cell.label}</span>
                      <p className="text-xs font-bold text-zinc-900 capitalize leading-relaxed truncate">{cell.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Partner Details & Pricing (3 columns) */}
          <div className="lg:col-span-3 flex flex-col gap-6 justify-between h-full">
            
            {/* Service Partner Details */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.015)]">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-4">Assigned Partner</p>
              {providerName ? (
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md">
                    {providerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-zinc-950 truncate leading-tight">{providerName}</p>
                    {providerPhone ? (
                      <a href={`tel:${providerPhone}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors mt-1">
                        <Phone size={10} /> {providerPhone}
                      </a>
                    ) : (
                      <p className="text-[10px] font-semibold text-zinc-400 mt-1">No phone provided</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-[10px] font-semibold text-zinc-500">
                  <ClipboardList size={14} className="text-zinc-400 shrink-0 animate-pulse" />
                  <span>Broadcasting request to verified technicians...</span>
                </div>
              )}
            </div>

            {/* Price breakdown and receipt details */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex-1 flex flex-col justify-between min-h-[220px]">
              <div>
                <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400 mb-4 pb-2 border-b border-zinc-100">Price breakdown</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Service charge", value: booking.pricing?.basePrice   },
                    { label: "Platform fee",   value: booking.pricing?.platformFee },
                    { label: "GST",            value: booking.pricing?.tax         },
                    booking.pricing?.discount ? { label: "Discount", value: -booking.pricing.discount } : null,
                  ].filter(Boolean).map(r => (
                    <div key={r.label} className="flex justify-between text-[11px] font-semibold">
                      <span className="text-zinc-500">{r.label}</span>
                      <span className={`text-zinc-900 ${r.value < 0 ? "text-emerald-600 font-bold" : ""}`}>
                        {r.value < 0 ? "- " : ""}{formatPrice(Math.abs(r.value || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-3 border-t border-zinc-100 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black tracking-widest uppercase text-zinc-400 block">Total Amount</span>
                  <span className="text-[10px] text-zinc-400 font-medium">Immediate billing</span>
                </div>
                <span className="text-lg font-black text-zinc-950">{formatPrice(booking.pricing?.totalAmount || 0)}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic completed tax invoice Receipt PDF section */}
        {isCompleted && (
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xl print:border-0 print:shadow-none print:rounded-none relative z-10" id="invoice">
            <div className="bg-zinc-950 text-white p-8 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"24px 24px"}} />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-700" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.35em] uppercase text-zinc-400 mb-3">Tax Invoice</p>
                  <div className="flex items-center gap-4 mb-2">
                    <img src="/logo-transparent.png" alt="EliteCrew" className="w-10 h-10 object-contain" />
                    <h2 className="text-3xl font-black tracking-tight text-white">EliteCrew</h2>
                  </div>
                  <p className="text-xs font-semibold text-zinc-400 max-w-sm leading-relaxed">
                    Official invoice for completed service, payment record, and provider proof.
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">Invoice Number</p>
                  <p className="font-mono text-sm font-black text-white">{booking.bookingNumber}</p>
                  <p className="mt-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500">{invoiceDate}</p>
                </div>
              </div>

              <div className="relative z-10 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Total Paid", value: formatPrice(booking.pricing?.totalAmount || 0), tone: "text-white" },
                  { label: "Payment", value: paymentMethodLabel, tone: "text-zinc-100" },
                  { label: "Status", value: booking.paymentStatus.replace("_", " "), tone: "text-emerald-400" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">{item.label}</p>
                    <p className={`text-xs font-black capitalize ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div className="border border-zinc-200/80 rounded-2xl bg-zinc-50/50 p-6">
                  <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400 mb-4 flex items-center gap-2">
                    <MapPin size={13} /> Billed To
                  </p>
                  <p className="text-lg font-black text-black mb-1">{customerName}</p>
                  {customerPhone && <p className="text-xs font-bold text-zinc-500 mb-2">{customerPhone}</p>}
                  <p className="text-xs font-semibold text-zinc-500 leading-relaxed">{addressLine || "Customer service address"}</p>
                </div>
                <div className="border border-zinc-200/80 rounded-2xl bg-zinc-50/50 p-6">
                  <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400 mb-4 flex items-center gap-2">
                    <Wrench size={13} /> Service Partner
                  </p>
                  <p className="text-lg font-black text-black mb-1">{providerName || "Assigned technician"}</p>
                  {providerPhone && <p className="text-xs font-bold text-zinc-500 mb-2">{providerPhone}</p>}
                  <p className="text-xs font-semibold text-zinc-500 leading-relaxed">Verified EliteCrew professional for this booking.</p>
                </div>
              </div>

              <div className="border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-4 bg-zinc-50 border-b border-zinc-250">
                  <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">Item Details</p>
                  <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500 text-right">Amount</p>
                </div>
                {invoiceRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1fr_auto] gap-4 px-6 py-5 border-b border-zinc-100 last:border-b-0">
                    <div>
                      <p className="text-xs font-black text-zinc-900">{row.label}</p>
                      <p className="text-[10px] font-semibold text-zinc-400 mt-1">{row.note}</p>
                    </div>
                    <p className={`text-xs font-black text-right ${row.value < 0 ? "text-emerald-600" : "text-black"}`}>
                      {row.value < 0 ? "- " : ""}{formatPrice(Math.abs(row.value || 0))}
                    </p>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_auto] gap-4 p-6 bg-zinc-950 text-white">
                  <div>
                    <p className="text-sm font-black tracking-widest uppercase">Grand Total</p>
                    <p className="text-[11px] font-semibold text-zinc-500 mt-1">Inclusive of taxes and fees</p>
                  </div>
                  <p className="text-2xl font-black text-right">{formatPrice(booking.pricing?.totalAmount || 0)}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-emerald-700 mb-2">Service Proof</p>
                <p className="text-xs font-semibold text-emerald-800 leading-relaxed">
                  Keep this invoice for payment proof, service history, assigned provider details, and future support queries.
                </p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:hidden border-t border-zinc-100 pt-8">
                <p className="text-xs font-semibold text-zinc-400 max-w-sm leading-relaxed">
                  The same invoice format is attached to the customer completion email as a PDF receipt.
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-black text-white px-8 py-3.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-zinc-800 shadow-xl transition-all"
                >
                  Print PDF Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dispute / Report Issue ── */}
        {["in_progress","completed","accepted","provider_on_way"].includes(booking.status) && !isCancelled && (
          <div className="print:hidden">
            {!showDispute ? (
              <button
                onClick={() => setShowDispute(true)}
                className="w-full border border-dashed border-zinc-300 text-zinc-400 py-3.5 text-[9px] font-bold tracking-widest uppercase hover:border-red-300 hover:text-red-500 transition-colors rounded-2xl bg-white shadow-[0_4px_25px_rgba(0,0,0,0.01)]"
              >
                ⚠ Report a Problem
              </button>
            ) : (
              <div className="bg-red-50/60 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-extrabold text-red-900">Report an Issue</p>
                  <button onClick={() => setShowDispute(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">×</button>
                </div>
                <form onSubmit={handleDispute} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold tracking-widest uppercase text-red-700 mb-2">Reason *</label>
                    <select
                      required
                      value={disputeForm.reason}
                      onChange={e => setDisputeForm(f => ({ ...f, reason: e.target.value }))}
                      className="w-full border border-red-200 bg-white px-3 py-2.5 text-xs text-black focus:outline-none focus:border-red-400 rounded-xl"
                    >
                      <option value="">Select a reason…</option>
                      <option value="Work not completed">Work not completed properly</option>
                      <option value="Provider did not show">Provider did not show up</option>
                      <option value="Overcharged">Overcharged / extra charges</option>
                      <option value="Damage caused">Damage caused to property</option>
                      <option value="Unprofessional behavior">Unprofessional behavior</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold tracking-[0.25em] uppercase text-red-700 mb-2">Details</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the issue in detail…"
                      value={disputeForm.description}
                      onChange={e => setDisputeForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border border-red-200 bg-white px-3 py-2.5 text-xs text-black focus:outline-none focus:border-red-400 resize-none rounded-xl"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowDispute(false)}
                      className="flex-1 border border-zinc-200 text-zinc-600 py-2.5 text-[9px] font-bold tracking-widest uppercase hover:border-zinc-400 rounded-xl transition-colors bg-white">
                      Cancel
                    </button>
                    <button type="submit" disabled={disputeLoading || !disputeForm.reason}
                      className="flex-1 bg-red-600 text-white py-2.5 text-[9px] font-bold tracking-widest uppercase hover:bg-red-700 disabled:opacity-50 rounded-xl transition-colors">
                      {disputeLoading ? "Submitting…" : "Submit Dispute"}
                    </button>
                  </div>
                </form>
                <p className="mt-3 text-[9px] text-red-600 font-semibold">
                  Our support team reviews all disputes within 24 hours and will contact you.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Panel */}
        <div className="flex flex-wrap gap-4 pt-4 print:hidden z-10 relative">
          {canCancel && (
            <button onClick={handleCancel} disabled={cancelling}
              className="flex-1 rounded-2xl border border-red-200 bg-red-50 text-red-600 py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm">
              {cancelling ? "Cancelling…" : "Cancel Booking"}
            </button>
          )}
          {isCompleted && !booking.isRated && (
            <Link href={`/bookings/${id}/rate`}
              className="flex-1 rounded-2xl bg-zinc-950 text-white py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-black transition-colors text-center shadow-md">
              Rate This Service ★
            </Link>
          )}
          {isCompleted && booking.isRated && (
            <div className="flex-1 rounded-2xl border border-emerald-250 bg-emerald-50 text-emerald-700 py-4 text-[10px] font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={14} /> Rated
            </div>
          )}
          {isCompleted && booking.serviceSlug && (
            <Link href={`/book/${booking.serviceSlug}`}
              className="flex-1 rounded-2xl border border-zinc-200 bg-white text-zinc-950 py-4 text-[10px] font-bold tracking-widest uppercase hover:border-zinc-400 transition-all text-center shadow-sm">
              🔁 Book Again
            </Link>
          )}
          <Link href="/"
            className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 py-4 text-[10px] font-bold tracking-widest uppercase hover:text-black hover:border-zinc-300 transition-colors text-center shadow-sm">
            New Service
          </Link>
        </div>

      </div>

      {/* Mobile bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 px-4 py-3 flex items-center justify-between gap-3 print:hidden">
        <span className={`inline-flex items-center gap-1.5 text-[8px] font-bold tracking-widest uppercase px-3 py-2 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {st.label}
        </span>
        <Link href="/bookings" className="flex-1 text-center bg-zinc-950 text-white py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
          All Bookings
        </Link>
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling}
            className="flex-1 text-center border border-red-200 bg-red-50 text-red-600 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase disabled:opacity-50">
            {cancelling ? "…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
