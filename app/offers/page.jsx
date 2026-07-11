"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  AlertCircle, Check, Copy, RefreshCw, Tag, Ticket,
} from "lucide-react";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function discountLabel(coupon) {
  return coupon.discountType === "percent"
    ? `${coupon.discountValue}% OFF`
    : `₹${coupon.discountValue} OFF`;
}

function CouponCard({ coupon }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — nothing to fall back to gracefully here.
    }
  };

  return (
    <div className="relative bg-white border border-zinc-100 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-stretch">
        {/* Left — discount */}
        <div className="w-28 shrink-0 bg-zinc-950 text-white flex flex-col items-center justify-center gap-1 px-2 py-5">
          <Tag size={16} className="text-emerald-400" />
          <p className="text-sm font-black leading-tight text-center">{discountLabel(coupon)}</p>
        </div>

        {/* Perforation */}
        <div className="relative w-0">
          <div className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-zinc-50" />
          <div className="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-zinc-50" />
          <div className="h-full border-l border-dashed border-zinc-200" />
        </div>

        {/* Right — details */}
        <div className="flex-1 min-w-0 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {coupon.description && (
              <p className="text-sm font-bold text-zinc-900 truncate">{coupon.description}</p>
            )}
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {coupon.minOrderValue > 0 ? `Min. order ₹${coupon.minOrderValue} · ` : ""}
              Valid till {fmtDate(coupon.expiresAt)}
            </p>
            {coupon.applicableCategories?.length > 0 && (
              <p className="text-[10px] font-semibold text-zinc-400 mt-1 truncate">
                Applicable on: {coupon.applicableCategories.join(", ")}
              </p>
            )}
          </div>

          <button
            onClick={copy}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold tracking-widest uppercase border transition-colors ${
              copied
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : coupon.code}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = () => {
    const user = getStoredUser();
    if (!user) { router.replace("/login?redirect=/offers"); return; }
    setLoading(true);
    setError(false);
    api.get("/coupons")
      .then(({ data }) => { if (data.success) setCoupons(data.coupons || []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white pb-16">

      {/* Header */}
      <div className="bg-zinc-950 text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">Save More</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Offers &amp; Coupons</h1>
          <p className="text-zinc-400 text-sm">Copy a code below and paste it at checkout to get the discount.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-4">

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-100 rounded-lg h-24 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="font-bold text-zinc-900 mb-4">Could not load offers</p>
            <button onClick={load}
              className="flex items-center gap-2 mx-auto text-[10px] font-bold tracking-widest uppercase bg-black text-white px-5 py-2.5 rounded-md hover:bg-zinc-800 transition-colors">
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && coupons.length === 0 && (
          <div className="bg-white border border-dashed border-zinc-200 rounded-lg p-14 text-center">
            <Ticket size={36} className="text-zinc-200 mx-auto mb-4" />
            <p className="font-extrabold text-zinc-900 mb-2">No active offers right now</p>
            <p className="text-sm text-zinc-400 max-w-xs mx-auto">
              Check back soon — new coupons show up here as soon as they go live.
            </p>
          </div>
        )}

        {!loading && !error && coupons.map((coupon) => (
          <CouponCard key={coupon._id} coupon={coupon} />
        ))}
      </div>
    </div>
  );
}
