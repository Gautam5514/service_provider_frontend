"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { CATEGORY_META } from "@/lib/services";
import {
  BadgeCheck, ChevronRight, Filter, MapPin,
  RefreshCw, Search, ShieldCheck, Star, Wrench,
} from "lucide-react";

const CATEGORIES = ["all", ...Object.keys(CATEGORY_META)];

function StarRow({ rating, size = 11 }) {
  const n = Math.round(rating || 0);
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} strokeWidth={0}
          className={i <= n ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"} />
      ))}
    </span>
  );
}

export default function ProvidersPage() {
  const [providers,  setProviders]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [cityFilter, setCityFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/providers");
      setProviders(data.providers || []);
    } catch { /* public endpoint, fail silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filter locally — the /providers endpoint returns all approved providers
  const filtered = providers.filter(p => {
    const q = search.toLowerCase();
    const nameMatch  = (p.userId?.fullName || "").toLowerCase().includes(q);
    const cityMatch  = (p.city || "").toLowerCase().includes(q);
    const svcMatch   = (p.services || []).some(s =>
      s.serviceName?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)
    );
    const textOk = !q || nameMatch || cityMatch || svcMatch;
    const catOk  = catFilter === "all" || (p.services || []).some(s => s.category === catFilter);
    const locOk  = !cityFilter || (p.city || "").toLowerCase().includes(cityFilter.toLowerCase());
    return textOk && catOk && locOk;
  });

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white">

      {/* ── Header ── */}
      <div className="bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-12">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widests uppercase text-zinc-400 hover:text-white transition-colors mb-6">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Verified Professionals
          </h1>
          <p className="text-zinc-400 text-sm">
            Every technician is Aadhaar, PAN &amp; background verified before being listed.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 space-y-6">

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Text search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, city, or service…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-zinc-200 pl-9 pr-4 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded-lg"
            />
          </div>
          {/* City */}
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by city…"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full sm:w-44 bg-white border border-zinc-200 pl-9 pr-4 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded-lg"
            />
          </div>
        </div>

        {/* ── Category chips ── */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} type="button"
              onClick={() => setCatFilter(cat)}
              className={`px-3.5 py-1.5 text-[10px] font-bold tracking-wide uppercase border transition-colors rounded-full ${
                catFilter === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
              }`}>
              {cat === "all" ? "All Categories" : (CATEGORY_META[cat]?.label || cat)}
            </button>
          ))}
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <p className="text-[10px] font-bold tracking-widests uppercase text-zinc-400">
            {filtered.length} professional{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="bg-white border border-zinc-200 rounded-lg p-5 animate-pulse h-44" />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white border border-dashed border-zinc-200 rounded-lg p-14 text-center">
            <Wrench size={36} className="text-zinc-200 mx-auto mb-4" />
            <p className="text-base font-extrabold text-zinc-900 mb-2">No professionals found</p>
            <p className="text-sm text-zinc-400">Try a different city or remove the category filter.</p>
          </div>
        )}

        {/* ── Provider cards ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => {
              const name     = p.userId?.fullName || "Professional";
              const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const services = (p.services || []).slice(0, 3);
              const tier     = p.jobTier === "priority" ? "Priority" : p.jobTier === "home_entry" ? "Verified" : "Basic";
              const tierColor = tier === "Priority" ? "bg-amber-50 text-amber-700 border-amber-200"
                              : tier === "Verified"  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200";

              return (
                <div key={p._id}
                  className="group bg-white border border-zinc-200 rounded-lg p-5 hover:border-black hover:shadow-md transition-all duration-200">
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-md bg-zinc-950 text-white text-sm font-black flex items-center justify-center shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-black truncate">{name}</p>
                      <p className="text-xs text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {p.city || "—"}
                      </p>
                    </div>
                    <span className={`text-[8px] font-bold tracking-widests uppercase border px-2 py-0.5 shrink-0 ${tierColor}`}>
                      {tier}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <StarRow rating={p.rating || 0} />
                    <span className="text-xs font-bold text-zinc-700">
                      {p.rating ? p.rating.toFixed(1) : "New"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      · {p.totalReviews || 0} review{p.totalReviews !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {services.map((s, i) => (
                      <span key={i}
                        className="text-[9px] font-bold tracking-wide uppercase bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full">
                        {s.serviceName || s.category}
                      </span>
                    ))}
                    {(p.services || []).length > 3 && (
                      <span className="text-[9px] font-bold text-zinc-400">
                        +{p.services.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Completed jobs */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <BadgeCheck size={13} className="text-emerald-500" />
                      {p.totalJobsCompleted || 0} jobs done
                    </div>
                    <Link href={`/services/${services[0]?.category || "ac"}`}
                      className="flex items-center gap-1 text-[10px] font-bold tracking-widests uppercase text-black group-hover:underline underline-offset-2">
                      Book <ChevronRight size={11} />
                    </Link>
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
