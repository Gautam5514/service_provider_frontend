"use client";

import Link from "next/link";
import BrandLoader from "@/components/BrandLoader";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Users, AlertTriangle, CheckCircle2, TrendingUp, Calendar, RefreshCw, Star, Activity, ArrowUpRight, IndianRupee } from "lucide-react";

const STATUS_CONFIG = {
  pending_profile:          { dot: "bg-zinc-400",    label: "Pending Profile"  },
  profile_complete:         { dot: "bg-sky-500",     label: "Profile Complete" },
  kyc_submitted:            { dot: "bg-amber-500",   label: "KYC Submitted"    },
  kyc_verified:             { dot: "bg-blue-500",    label: "KYC Verified"     },
  skill_review_pending:     { dot: "bg-amber-500",   label: "Skill Review"     },
  background_check_pending: { dot: "bg-violet-500",  label: "BGV Pending"      },
  approved:                 { dot: "bg-emerald-500", label: "Approved"         },
  rejected:                 { dot: "bg-red-500",     label: "Rejected"         },
  suspended:                { dot: "bg-orange-500",  label: "Suspended"        },
  blocked:                  { dot: "bg-red-700",     label: "Blocked"          },
};

function fmt(n) { return (n || 0).toLocaleString("en-IN"); }
function fmtCurrency(n) { return `₹${(n || 0).toLocaleString("en-IN")}`; }
function fmtCompact(n) {
  n = n || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
}

/* ── Polished "View all" pill button ───────────────────────────── */
function ViewAll({ href, label }) {
  return (
    <Link
      href={href}
      className="group/va inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white pl-3.5 pr-2.5 py-1.5 text-[11px] font-bold text-zinc-600 shadow-sm transition-all duration-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-md"
    >
      {label}
      <ArrowUpRight size={13} className="transition-transform duration-200 group-hover/va:translate-x-0.5 group-hover/va:-translate-y-0.5" />
    </Link>
  );
}

/* ── Smooth interactive area chart (SVG) ───────────────────────── */
function AreaChart({ data }) {
  const W = 640, H = 180, PAD_T = 16, PAD_B = 8;
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0)
    return <div className="h-[180px] flex items-center justify-center text-xs text-zinc-400 italic">No data yet</div>;

  const max = Math.max(...data.map(d => d.value), 1);
  const n = data.length;
  const innerH = H - PAD_T - PAD_B;
  const xAt = (i) => (i / (n - 1)) * W;
  const yAt = (v) => PAD_T + innerH - (v / max) * innerH;

  const pts = data.map((d, i) => [xAt(i), yAt(d.value)]);

  // Catmull-Rom → cubic bezier for a smooth premium curve
  let linePath = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    linePath += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }

  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round((x / W) * (n - 1))));
    setHover(i);
  };

  const h = hover != null ? { i: hover, x: pts[hover][0], y: pts[hover][1], d: data[hover] } : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-[180px] overflow-visible"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines */}
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="0" x2={W} y1={PAD_T + innerH * g} y2={PAD_T + innerH * g}
            stroke="#f4f4f5" strokeWidth="1" />
        ))}

        <path d={areaPath} fill="url(#areaFill)" />
        <path d={linePath} fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* hover crosshair + point */}
        {h && (
          <>
            <line x1={h.x} x2={h.x} y1={PAD_T} y2={H} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <circle cx={h.x} cy={h.y} r="5" fill="#fff" stroke="#18181b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      {/* floating tooltip */}
      {h && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-zinc-900 px-3 py-1.5 text-center shadow-lg"
          style={{ left: `${(h.x / W) * 100}%`, top: `${(h.y / H) * 100}%`, marginTop: -10 }}
        >
          <p className="text-sm font-black text-white leading-none">{fmt(h.d.value)}</p>
          <p className="mt-0.5 text-[9px] font-medium text-zinc-400 whitespace-nowrap">
            {new Date(h.d.label).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardHome() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [recent,  setRecent]  = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/providers/pending"),
      ]);
      setData(analyticsRes.data);

      const pending = pendingRes.data.providers || [];
      setRecent(
        [...pending]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      );
      setUpdatedAt(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return (
    <div className="min-h-screen bg-[#f7f7f8] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-black text-zinc-900 mb-2">Cannot reach backend</h2>
        <p className="text-sm text-zinc-500 mb-6">Ensure the server is running on <code className="bg-zinc-100 text-black px-1.5 py-0.5 rounded text-xs font-mono">localhost:5050</code>.</p>
        <button onClick={() => load()} className="flex items-center justify-center gap-2 w-full bg-zinc-900 text-white px-5 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors">
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    </div>
  );

  if (loading) return <BrandLoader fullScreen label="Loading metrics…" />;

  const { stats, dailyCounts, categoryRevenue, topProviders } = data;

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split("T")[0];
    const found = dailyCounts?.find(x => x._id === key);
    return { label: key, value: found?.count || 0 };
  });

  const xLabels = chartData.filter((_, i) => i % 6 === 0 || i === 29).map(d => ({
    label: new Date(d.label).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    idx:   chartData.indexOf(d),
  }));

  const totalCatRevenue = (categoryRevenue || []).reduce((s, c) => s + (c.revenue || 0), 0);

  const cards = [
    { label: "Total Revenue",    value: fmtCompact(stats.revenue.total),       sub: `${fmtCompact(stats.revenue.month)} this month`, icon: IndianRupee, accent: "emerald" },
    { label: "Bookings Today",   value: fmt(stats.bookings.today),             sub: `${fmt(stats.bookings.week)} this week`,         icon: Calendar,    accent: "blue"    },
    { label: "Total Customers",  value: fmt(stats.users.customers),            sub: `+${fmt(stats.users.signupsMonth)} this month`,  icon: Users,       accent: "violet"  },
    { label: "Needs Assignment", value: fmt(stats.bookings.pendingUnassigned), sub: "Unclaimed bookings",                            icon: Activity,    accent: "amber", highlight: stats.bookings.pendingUnassigned > 0 },
  ];

  const ACCENT = {
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", bar: "bg-emerald-400" },
    blue:    { text: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100",    bar: "bg-blue-400"    },
    violet:  { text: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100",  bar: "bg-violet-400"  },
    amber:   { text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   bar: "bg-amber-400"   },
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] pb-16 font-sans selection:bg-black selection:text-white">

      {/* ── Dark Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white pb-14">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"32px 32px"}} />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-32 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative px-6 md:px-12 py-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">Central Operations</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">Admin Dashboard.</h1>
            <p className="text-sm text-zinc-400 mt-2">Platform analytics, provider applications, and revenue tracking.</p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 -mt-8 max-w-7xl mx-auto space-y-6 relative z-10">

        {/* ── Priority Alert ── */}
        {stats.providers.pending > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5 md:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div>
                <p className="text-base font-black text-amber-900">Provider Applications Pending</p>
                <p className="text-sm text-amber-700">{stats.providers.pending} professional{stats.providers.pending !== 1 ? "s" : ""} awaiting onboarding review and approval.</p>
              </div>
            </div>
            <Link href="/admin/providers" className="w-full sm:w-auto text-center bg-amber-500 text-white px-6 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-amber-600 transition-colors whitespace-nowrap">
              Review Now
            </Link>
          </div>
        )}

        {/* ── Primary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => {
            const a = ACCENT[c.accent];
            return (
              <div key={i} className={`relative bg-white rounded-2xl border ${c.highlight ? "border-amber-200" : "border-zinc-100"} p-5 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                <div className={`absolute top-0 left-0 h-full w-1 ${a.bar} ${c.highlight ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`} />
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 ${a.bg} ${a.border} border rounded-xl flex items-center justify-center`}>
                    <c.icon size={18} className={a.text} strokeWidth={2} />
                  </div>
                  {c.highlight && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mt-1" />}
                </div>
                <p className="text-2xl md:text-3xl font-black text-zinc-900 mb-0.5 tracking-tight">{c.value}</p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{c.label}</p>
                <p className="text-[11px] text-zinc-400 mt-1">{c.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ── Charts Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Booking Volume Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-1">Booking Volume</p>
                <p className="text-base font-black text-zinc-900">Last 30 Days</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-zinc-900 leading-none">{fmt(stats.bookings.total)}</p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mt-1">All-time total</p>
              </div>
            </div>
            <AreaChart data={chartData} />
            <div className="flex justify-between mt-3 px-1 border-t border-zinc-100 pt-2.5">
              {xLabels.map(x => (
                <span key={x.idx} className="text-[9px] font-medium text-zinc-400">{x.label}</span>
              ))}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-1">Revenue Stream</p>
                <p className="text-base font-black text-zinc-900">By Category</p>
              </div>
              <TrendingUp size={16} className="text-emerald-500 mt-1" />
            </div>

            {(categoryRevenue || []).length === 0 ? (
              <div className="flex-1 min-h-32 flex items-center justify-center border border-dashed border-zinc-100 rounded-xl">
                <p className="text-xs text-zinc-400 font-medium">No completed bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {categoryRevenue.slice(0, 5).map(c => {
                  const pct = totalCatRevenue ? Math.round((c.revenue / totalCatRevenue) * 100) : 0;
                  return (
                    <div key={c._id} className="group">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-bold text-zinc-700 capitalize group-hover:text-black transition-colors">{c._id}</span>
                        <span className="text-xs font-black text-zinc-900">{fmtCurrency(c.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-zinc-800 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-400 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Lists Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top Providers */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <p className="text-[11px] font-black tracking-[0.15em] uppercase text-zinc-700">Top Providers</p>
              </div>
              <ViewAll href="/admin/approved" label="View directory" />
            </div>
            <div className="flex-1">
              {(topProviders || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">No active providers yet</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {topProviders.map((p, i) => (
                    <Link key={p._id} href={`/admin/providers/${p._id}`} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors group">
                      <span className="text-[11px] font-black text-zinc-300 w-4 text-center group-hover:text-zinc-900 transition-colors">{i + 1}</span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm">
                        {(p.userId?.fullName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate group-hover:text-black">{p.userId?.fullName || "Unknown"}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate flex items-center gap-1.5">
                          {p.city} <span className="text-zinc-300">•</span> <Star size={10} className="text-amber-400 fill-amber-400" /> {p.rating?.toFixed(1) || "New"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-emerald-600">{p.totalJobsCompleted}</p>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mt-0.5">Jobs</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-zinc-400" />
                <p className="text-[11px] font-black tracking-[0.15em] uppercase text-zinc-700">Recent Applications</p>
              </div>
              <ViewAll href="/admin/providers" label="View queue" />
            </div>
            <div className="flex-1">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">No pending applications</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {recent.map(p => {
                    const s = STATUS_CONFIG[p.onboardingStatus] || STATUS_CONFIG.pending_profile;
                    return (
                      <Link key={p._id} href={`/admin/providers/${p._id}`} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-black text-zinc-500 flex-shrink-0 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all">
                          {(p.userId?.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate group-hover:text-black">{p.userId?.fullName || "Unknown"}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{p.userId?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 bg-white border border-zinc-100 px-2.5 py-1 rounded-full shadow-sm">
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-600 hidden sm:inline">{s.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
