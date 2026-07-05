"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ExternalLink,
  Inbox,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

const STATUS_META = {
  new:         { label: "New",         cls: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
  shortlisted: { label: "Shortlisted", cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  hired:       { label: "Hired",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected:    { label: "Rejected",    cls: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-400" },
};
const PIPELINE = ["new", "shortlisted", "hired", "rejected"];

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const initials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

export default function AdminCareerApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data } = await api.get("/careers/admin/applications");
      setApps(data.applications || []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = apps;
    if (filter !== "all") list = list.filter((a) => a.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.career?.title || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [apps, filter, query]);

  const selected = useMemo(
    () => filtered.find((a) => a._id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  const counts = useMemo(() => {
    const c = { all: apps.length, new: 0, shortlisted: 0, hired: 0, rejected: 0 };
    for (const a of apps) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [apps]);

  const setStatus = async (appId, status) => {
    try {
      await api.put(`/careers/admin/applications/${appId}/status`, { status });
      setApps((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
    } catch {
      alert("Could not update the applicant status.");
    }
  };

  if (fetchError)
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-zinc-200 p-8 text-center max-w-sm w-full rounded-lg">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-black text-zinc-900 mb-1">Failed to load applications</h2>
          <p className="text-xs text-zinc-500 mb-5">Check that the backend is running and retry.</p>
          <button
            onClick={load}
            className="flex items-center justify-center gap-2 w-full bg-black text-white px-5 py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors rounded-lg"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f7f8] pb-20 font-sans selection:bg-black selection:text-white">
      {/* ── Dark header ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white pb-12">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative px-6 md:px-12 py-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">
              Hiring &amp; Recruitment
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Job Applicants
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Every application across all roles — review, shortlist, and hire from one inbox.
            </p>
          </div>
          <Link
            href="/admin/careers"
            className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors shrink-0"
          >
            <Briefcase size={11} /> Manage Job Posts
          </Link>
        </div>
      </div>

      <div className="px-6 md:px-12 -mt-8 max-w-7xl mx-auto relative z-10">
        {/* ── Filter + search bar ───────────────────────────────────────── */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {["all", ...PIPELINE].map((s) => {
              const isActive = filter === s;
              const meta = STATUS_META[s];
              return (
                <button
                  key={s}
                  onClick={() => { setFilter(s); setSelectedId(null); }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-colors ${
                    isActive ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
                  {s === "all" ? "All" : meta.label}
                  <span className={isActive ? "text-zinc-400" : "text-zinc-400"}>
                    {counts[s] || 0}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative lg:ml-auto lg:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
            <input
              type="text"
              placeholder="Search name, email, or role…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
              className="w-full border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* ── Split view ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center text-xs text-zinc-400 font-semibold">
            Loading applications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center">
            <Inbox size={26} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-black text-zinc-900 mb-1">No applications here</p>
            <p className="text-xs text-zinc-400">
              {apps.length === 0
                ? "Applications appear the moment someone applies on the careers page."
                : "Try a different filter or search."}
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
            {/* Left — applicant list */}
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100 max-h-[70vh] overflow-y-auto">
              {filtered.map((a) => {
                const meta = STATUS_META[a.status] || STATUS_META.new;
                const isSel = selected?._id === a._id;
                return (
                  <button
                    key={a._id}
                    onClick={() => setSelectedId(a._id)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                      isSel ? "bg-zinc-950" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                        isSel ? "bg-[#C8A45C] text-black" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {initials(a.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] font-black truncate ${isSel ? "text-white" : "text-zinc-900"}`}>
                          {a.name}
                        </span>
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </span>
                      <span className={`block text-[11.5px] truncate mt-0.5 ${isSel ? "text-zinc-400" : "text-zinc-500"}`}>
                        {a.career?.title || "Role removed"}
                      </span>
                      <span className={`block text-[10.5px] mt-0.5 ${isSel ? "text-zinc-500" : "text-zinc-400"}`}>
                        {fmtDateTime(a.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right — detail panel */}
            {selected && (
              <div className="bg-white border border-zinc-200 rounded-lg">
                {/* header */}
                <div className="p-6 md:p-7 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-zinc-950 text-[16px] font-black text-[#C8A45C]">
                    {initials(selected.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-zinc-900">{selected.name}</h2>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase size={12} /> {selected.career?.title || "Role removed"}
                      </span>
                      {selected.career?.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} /> {selected.career.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={12} /> {fmtDateTime(selected.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* pipeline */}
                <div className="px-6 md:px-7 py-5 border-b border-zinc-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-3">
                    Pipeline stage
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PIPELINE.map((s) => {
                      const meta = STATUS_META[s];
                      const isActive = selected.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(selected._id, s)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold border transition-all ${
                            isActive
                              ? `${meta.cls} ring-1 ring-current`
                              : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* contact + links */}
                <div className="px-6 md:px-7 py-5 border-b border-zinc-100 grid sm:grid-cols-2 gap-4">
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-3 group">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
                      <Mail size={14} className="text-zinc-500" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400">Email</span>
                      <span className="block text-[13px] font-semibold text-zinc-900 truncate group-hover:underline">
                        {selected.email}
                      </span>
                    </span>
                  </a>
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-3 group">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
                      <Phone size={14} className="text-zinc-500" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400">Phone</span>
                      <span className="block text-[13px] font-semibold text-zinc-900 group-hover:underline">
                        {selected.phone}
                      </span>
                    </span>
                  </a>
                  {selected.portfolio && (
                    <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
                        <ExternalLink size={14} className="text-zinc-500" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400">Portfolio / LinkedIn</span>
                        <span className="block text-[13px] font-semibold text-sky-600 truncate group-hover:underline">
                          {selected.portfolio.replace(/^https?:\/\//, "")}
                        </span>
                      </span>
                    </a>
                  )}
                  {selected.resumeUrl && (
                    <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
                        <ArrowUpRight size={14} className="text-zinc-500" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400">Resume</span>
                        <span className="block text-[13px] font-semibold text-sky-600 truncate group-hover:underline">
                          Open resume link
                        </span>
                      </span>
                    </a>
                  )}
                </div>

                {/* cover note */}
                <div className="px-6 md:px-7 py-5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2.5 flex items-center gap-2">
                    <UserRound size={11} /> Why them — in their words
                  </p>
                  {selected.coverNote ? (
                    <p className="text-[13.5px] leading-7 text-zinc-700 bg-[#fafafa] border border-zinc-100 rounded-lg px-5 py-4 whitespace-pre-wrap">
                      {selected.coverNote}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No cover note provided.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
