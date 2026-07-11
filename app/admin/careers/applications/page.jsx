"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { refreshAdminBadges } from "@/lib/adminBadges";
import { useAdminToast } from "@/lib/useAdminToast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { getSocket, ensureSocket } from "@/lib/socket";
import AdminToast from "@/components/AdminToast";
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MousePointerClick,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

const STATUS_META = {
  new:         { label: "New",         cls: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
  shortlisted: { label: "Shortlisted", cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  hired:       { label: "Hired",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected:    { label: "Rejected",    cls: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-400" },
};
const PIPELINE = ["new", "shortlisted", "hired", "rejected"];
const PAGE_SIZE = 25;
const EMPTY_COUNTS = { all: 0, new: 0, shortlisted: 0, hired: 0, rejected: 0 };

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

function ListSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 flex items-start gap-3 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-zinc-100 flex-shrink-0" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-3 bg-zinc-100 rounded w-2/3" />
            <div className="h-2.5 bg-zinc-100 rounded w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminCareerApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [unseenCount, setUnseenCount] = useState(0);

  const [loading, setLoading] = useState(true);       // only the very first fetch
  const [refetching, setRefetching] = useState(false); // every fetch after that
  const [fetchError, setFetchError] = useState(false);

  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 350);

  const [selectedId, setSelectedId] = useState(null);
  const [liveNewCount, setLiveNewCount] = useState(0);

  const { toast, showToast, dismissToast } = useAdminToast();

  // ── Fetch a specific page/search/status combo. Never depends on component
  // state directly — every caller passes exactly what it wants — so there's
  // no stale-closure risk and no accidental double-fetch. ──────────────────
  // Guards against out-of-order responses — if the admin flips filters or
  // pages quickly, a slower earlier request must never clobber a faster,
  // more recent one.
  const requestIdRef = useRef(0);

  const fetchApplications = useCallback(async ({ page: p, search: s, status: st }) => {
    const requestId = ++requestIdRef.current;
    setRefetching(true);
    setFetchError(false);
    try {
      const { data } = await api.get("/careers/admin/applications", {
        params: { page: p, limit: PAGE_SIZE, search: s || undefined, status: st },
      });
      if (requestId !== requestIdRef.current) return; // a newer request has since superseded this one
      setApps(data.applications || []);
      setPagination(data.pagination || { page: p, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setCounts(data.counts || EMPTY_COUNTS);
      setUnseenCount(data.unseenCount || 0);
      setLiveNewCount(0);
    } catch {
      if (requestId === requestIdRef.current) setFetchError(true);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefetching(false);
      }
    }
  }, []);

  // A change in search or status always resets to page 1 and reloads —
  // also covers the very first load on mount.
  useEffect(() => {
    setPage(1);
    setSelectedId(null);
    fetchApplications({ page: 1, search, status: filter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), pagination.totalPages || 1);
    setPage(clamped);
    fetchApplications({ page: clamped, search, status: filter });
  };

  const retry = () => fetchApplications({ page, search, status: filter });

  // ── Live "something just arrived" signal — never mutates the paginated
  // list in place (that would desync skip/limit against what's on screen);
  // instead a small banner offers a deliberate refresh. ────────────────────
  useEffect(() => {
    let mounted = true;
    let bound = null;
    async function setup() {
      let s = getSocket();
      if (!s) s = await ensureSocket();
      if (!s || !mounted) return;
      const handler = () => setLiveNewCount((c) => c + 1);
      s.on("career:application:new", handler);
      bound = { socket: s, handler };
    }
    setup();
    return () => {
      mounted = false;
      if (bound) bound.socket.off("career:application:new", bound.handler);
    };
  }, []);

  // selected must come from the currently loaded page — searching/paginating
  // never auto-opens anything, only a deliberate click does.
  const selected = useMemo(() => apps.find((a) => a._id === selectedId) || null, [apps, selectedId]);

  // The only place an application is ever marked "seen" — a deliberate click
  // on its row. Optimistic, with a silent rollback if the server call fails
  // (view-tracking is background bookkeeping — not worth a toast over).
  const openApplication = (app) => {
    setSelectedId(app._id);
    if (app.adminViewed) return;
    setApps((prev) => prev.map((a) => (a._id === app._id ? { ...a, adminViewed: true } : a)));
    setUnseenCount((c) => Math.max(0, c - 1));
    api.put(`/careers/admin/applications/${app._id}/view`)
      .then(refreshAdminBadges)
      .catch(() => {
        setApps((prev) => prev.map((a) => (a._id === app._id ? { ...a, adminViewed: false } : a)));
        setUnseenCount((c) => c + 1);
      });
  };

  // Optimistic pipeline-stage change, rolled back with a toast if it fails —
  // this is a deliberate decision, so the admin needs to know if it didn't stick.
  const setStatus = async (appId, status) => {
    const previous = apps;
    setApps((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
    try {
      await api.put(`/careers/admin/applications/${appId}/status`, { status });
      showToast(`Marked as ${STATUS_META[status]?.label || status}.`);
    } catch {
      setApps(previous);
      showToast("Could not update the applicant's status — please try again.", { ok: false });
    }
  };

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

  if (fetchError && apps.length === 0 && !refetching)
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-zinc-200 p-8 text-center max-w-sm w-full rounded-lg">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-black text-zinc-900 mb-1">Failed to load applications</h2>
          <p className="text-xs text-zinc-500 mb-5">Check that the backend is running and retry.</p>
          <button
            onClick={retry}
            className="flex items-center justify-center gap-2 w-full bg-black text-white px-5 py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors rounded-lg"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f7f8] pb-20 font-sans selection:bg-black selection:text-white">
      <AdminToast toast={toast} onDismiss={dismissToast} />

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
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight flex items-center gap-3 flex-wrap">
              Job Applicants
              {unseenCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/25 text-sky-300 px-3 py-1 text-[11px] font-bold tracking-widest uppercase rounded-full align-middle">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  {unseenCount} unseen
                </span>
              )}
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
                  onClick={() => setFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-colors ${
                    isActive ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
                  {s === "all" ? "All" : meta.label}
                  <span className="text-zinc-400">{counts[s] || 0}</span>
                </button>
              );
            })}
          </div>
          <div className="relative lg:ml-auto lg:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
            <input
              type="text"
              placeholder="Search name, email, or role…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg pl-9 pr-8 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
            />
            {refetching && (
              <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 animate-spin" />
            )}
          </div>
        </div>

        {/* ── Split view ────────────────────────────────────────────────── */}
        {loading ? (
          <ListSkeleton />
        ) : apps.length === 0 ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center">
            <Inbox size={26} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-black text-zinc-900 mb-1">No applications here</p>
            <p className="text-xs text-zinc-400">
              {!search.trim() && counts.all === 0
                ? "Applications appear the moment someone applies on the careers page."
                : "Try a different filter or search."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
              {/* Left — applicant list */}
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
                {liveNewCount > 0 && (
                  <button
                    onClick={() => goToPage(1)}
                    className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold tracking-wide py-2.5 transition-colors"
                  >
                    <Sparkles size={12} />
                    {liveNewCount} new application{liveNewCount > 1 ? "s" : ""} — click to refresh
                  </button>
                )}
                <div className="divide-y divide-zinc-100 max-h-[65vh] overflow-y-auto">
                  {apps.map((a) => {
                    const meta = STATUS_META[a.status] || STATUS_META.new;
                    const isSel = selected?._id === a._id;
                    const unseen = !a.adminViewed;
                    return (
                      <button
                        key={a._id}
                        onClick={() => openApplication(a)}
                        className={`w-full text-left p-4 flex items-start gap-3 transition-colors relative ${
                          isSel ? "bg-zinc-950" : "hover:bg-zinc-50"
                        }`}
                      >
                        {unseen && (
                          <span
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-500"
                            title="Not yet opened"
                          />
                        )}
                        <span
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                            isSel ? "bg-[#C8A45C] text-black" : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {initials(a.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className={`text-[13px] truncate ${unseen ? "font-black" : "font-semibold"} ${isSel ? "text-white" : "text-zinc-900"}`}>
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

                {/* Pagination footer */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-100 bg-zinc-50/60">
                  <p className="text-[10.5px] font-semibold text-zinc-400">
                    {pagination.total > 0 ? `${showingFrom}–${showingTo} of ${pagination.total}` : "0 results"}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || refetching}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-[10.5px] font-bold text-zinc-600 px-1.5 tabular-nums">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= pagination.totalPages || refetching}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right — detail panel */}
              {selected ? (
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
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-lg py-24 text-center">
                  <MousePointerClick size={26} className="text-zinc-200 mb-3" />
                  <p className="text-sm font-black text-zinc-900 mb-1">Select an applicant</p>
                  <p className="text-xs text-zinc-400 max-w-[220px]">
                    Click anyone in the list to see their full application here.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
