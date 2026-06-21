"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Star, Briefcase, IndianRupee, CheckCircle2, Clock, XCircle, MapPin, Calendar, User } from "lucide-react";

const STATUS_CONFIG = {
  pending:         { bg: "bg-zinc-100",   text: "text-zinc-600",    dot: "bg-zinc-400",    label: "Pending"     },
  accepted:        { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     label: "Accepted"    },
  provider_on_way: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    label: "On the way"  },
  in_progress:     { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: "In progress" },
  completed:       { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed"   },
  cancelled:       { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     label: "Cancelled"   },
  disputed:        { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  label: "Disputed"    },
};

function fmtCurrency(n) { return `₹${(n || 0).toLocaleString("en-IN")}`; }
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

const FILTERS = [
  { key: "all",       label: "All Jobs"  },
  { key: "completed", label: "Completed" },
  { key: "active",    label: "Active"    },
  { key: "cancelled", label: "Cancelled" },
];

function matchFilter(b, f) {
  if (f === "all")       return true;
  if (f === "completed") return b.status === "completed";
  if (f === "active")    return ["pending", "accepted", "provider_on_way", "in_progress"].includes(b.status);
  if (f === "cancelled") return ["cancelled", "disputed"].includes(b.status);
  return true;
}

export default function ProviderJobsPage({ params }) {
  const { id } = use(params);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/admin/providers/${id}/bookings`);
        setData(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <XCircle size={28} className="text-red-400 mb-3" />
      <p className="text-sm font-bold text-zinc-700 mb-4">Could not load this provider&apos;s jobs.</p>
      <Link href="/admin/providers" className="text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-black">← Back to providers</Link>
    </div>
  );

  const { provider, bookings, summary } = data;
  const visible = bookings.filter(b => matchFilter(b, filter));

  const counts = {
    all:       bookings.length,
    completed: summary.completed,
    active:    summary.active,
    cancelled: summary.cancelled,
  };

  const stats = [
    { label: "Jobs Completed", value: summary.completed,              icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Total Earned",   value: fmtCurrency(summary.revenue),   icon: IndianRupee,  color: "text-zinc-900",    bg: "bg-zinc-100",   border: "border-zinc-200"    },
    { label: "Active Jobs",    value: summary.active,                 icon: Clock,        color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
    { label: "Rating",         value: provider.rating > 0 ? provider.rating.toFixed(1) : "New", icon: Star, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", sub: `${provider.totalReviews || 0} reviews` },
  ];

  return (
    <div className="p-6 md:p-12 font-sans selection:bg-black selection:text-white">
      <div className="max-w-5xl mx-auto">

        {/* Back + header */}
        <Link href={`/admin/providers/${id}`} className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-black transition-colors mb-6">
          <ArrowLeft size={14} /> Back to profile
        </Link>

        <div className="flex items-center gap-4 border-b border-zinc-200 pb-6 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-lg font-black text-white shadow-sm flex-shrink-0">
            {(provider.fullName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-black truncate">{provider.fullName}</h1>
            <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5">
              <Briefcase size={13} /> Job history &amp; work record
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
              <div className={`w-9 h-9 ${s.bg} ${s.border} border rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={16} className={s.color} strokeWidth={2} />
              </div>
              <p className="text-2xl font-black text-zinc-900 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mt-0.5">{s.label}</p>
              {s.sub && <p className="text-[10px] text-zinc-400 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-zinc-200 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 -mb-px whitespace-nowrap ${
                filter === f.key ? "border-black text-black" : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              {f.label}
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded font-bold ${
                filter === f.key ? "bg-black text-white" : "bg-zinc-100 text-zinc-500"
              }`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Jobs list */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-300 bg-white rounded-2xl">
            <Briefcase size={28} className="text-zinc-300 mb-3" />
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">No jobs in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(b => {
              const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
              const rating = b.ratingId?.rating;
              return (
                <div key={b._id} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h2 className="text-sm font-bold text-black truncate">{b.serviceName}</h2>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        {b.bookingNumber && (
                          <span className="text-[10px] font-mono text-zinc-400">#{b.bookingNumber}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><User size={12} /> {b.customerId?.fullName || "Customer"}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(b.scheduledDate)}{b.scheduledTimeSlot ? `, ${b.scheduledTimeSlot}` : ""}</span>
                        {b.address?.city && <span className="flex items-center gap-1"><MapPin size={12} /> {b.address.city}</span>}
                        {b.serviceCategory && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest rounded-md">{b.serviceCategory}</span>
                        )}
                      </div>
                      {b.ratingId?.review && (
                        <p className="text-xs text-zinc-500 italic mt-2 line-clamp-2">&ldquo;{b.ratingId.review}&rdquo;</p>
                      )}
                    </div>

                    <div className="flex items-center gap-5 flex-shrink-0 md:pl-4 md:border-l border-zinc-100">
                      {rating > 0 && (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star size={13} className="text-amber-400 fill-amber-400" />
                            <span className="text-sm font-extrabold text-black">{rating.toFixed(1)}</span>
                          </div>
                          <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mt-1">Rated</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm font-black text-zinc-900">{fmtCurrency(b.pricing?.totalAmount)}</p>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mt-0.5">
                          {b.status === "completed" ? "Earned" : "Value"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
