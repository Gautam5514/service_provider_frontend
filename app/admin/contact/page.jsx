"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { refreshAdminBadges } from "@/lib/adminBadges";
import { useAdminToast } from "@/lib/useAdminToast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { getSocket, ensureSocket } from "@/lib/socket";
import AdminToast from "@/components/AdminToast";
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Frown,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  MousePointerClick,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";

const TOPIC_META = {
  booking:   { label: "Booking Support",    icon: CalendarDays,     cls: "bg-sky-50 text-sky-700 border-sky-200" },
  payment:   { label: "Payment / Invoice",  icon: CreditCard,       cls: "bg-violet-50 text-violet-700 border-violet-200" },
  provider:  { label: "Become a Partner",   icon: Briefcase,        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  complaint: { label: "Service Complaint",  icon: Frown,            cls: "bg-red-50 text-red-600 border-red-200" },
  feedback:  { label: "Feedback",           icon: Sparkles,         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  other:     { label: "General Enquiry",    icon: MessageCircle,    cls: "bg-zinc-50 text-zinc-600 border-zinc-200" },
};

const STATUS_META = {
  new:         { label: "New",         cls: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  resolved:    { label: "Resolved",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};
const PIPELINE = ["new", "in_progress", "resolved"];
const PAGE_SIZE = 25;
const EMPTY_COUNTS = { all: 0, new: 0, in_progress: 0, resolved: 0 };

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

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState([]);
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
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const { toast, showToast, dismissToast } = useAdminToast();

  // ── Fetch a specific page/search/status combo. Never depends on component
  // state directly — every caller passes exactly what it wants — so there's
  // no stale-closure risk and no accidental double-fetch. ──────────────────
  // Guards against out-of-order responses — if the admin flips filters or
  // pages quickly, a slower earlier request must never clobber a faster,
  // more recent one.
  const requestIdRef = useRef(0);

  const fetchMessages = useCallback(async ({ page: p, search: s, status: st }) => {
    const requestId = ++requestIdRef.current;
    setRefetching(true);
    setFetchError(false);
    try {
      const { data } = await api.get("/contact/admin", {
        params: { page: p, limit: PAGE_SIZE, search: s || undefined, status: st },
      });
      if (requestId !== requestIdRef.current) return; // a newer request has since superseded this one
      setMessages(data.messages || []);
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
    fetchMessages({ page: 1, search, status: filter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), pagination.totalPages || 1);
    setPage(clamped);
    fetchMessages({ page: clamped, search, status: filter });
  };

  const retry = () => fetchMessages({ page, search, status: filter });

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
      s.on("contact:message:new", handler);
      bound = { socket: s, handler };
    }
    setup();
    return () => {
      mounted = false;
      if (bound) bound.socket.off("contact:message:new", bound.handler);
    };
  }, []);

  // selected must come from the currently loaded page — searching/paginating
  // never auto-opens anything, only a deliberate click does.
  const selected = useMemo(() => messages.find((m) => m._id === selectedId) || null, [messages, selectedId]);

  useEffect(() => {
    setNoteDraft(selected?.adminNote || "");
  }, [selected?._id]);

  // The only place a message is ever marked "seen" — a deliberate click on
  // its row. Optimistic, with a silent rollback if the server call fails
  // (view-tracking is background bookkeeping — not worth a toast over).
  const openMessage = (msg) => {
    setSelectedId(msg._id);
    if (msg.adminViewed) return;
    setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, adminViewed: true } : m)));
    setUnseenCount((c) => Math.max(0, c - 1));
    api.put(`/contact/admin/${msg._id}/view`)
      .then(refreshAdminBadges)
      .catch(() => {
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, adminViewed: false } : m)));
        setUnseenCount((c) => c + 1);
      });
  };

  // Optimistic status change, rolled back with a toast if it fails — this is
  // a deliberate decision, so the admin needs to know if it didn't stick.
  const setStatus = async (id, status) => {
    const previous = messages;
    setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
    try {
      await api.put(`/contact/admin/${id}/status`, { status });
      showToast(`Marked as ${STATUS_META[status]?.label || status}.`);
    } catch {
      setMessages(previous);
      showToast("Could not update the message status — please try again.", { ok: false });
    }
  };

  const saveNote = async () => {
    if (!selected) return;
    setNoteSaving(true);
    const previousNote = selected.adminNote || "";
    setMessages((prev) => prev.map((m) => (m._id === selected._id ? { ...m, adminNote: noteDraft } : m)));
    try {
      await api.put(`/contact/admin/${selected._id}/note`, { adminNote: noteDraft });
      showToast("Internal note saved.");
    } catch {
      setMessages((prev) => prev.map((m) => (m._id === selected._id ? { ...m, adminNote: previousNote } : m)));
      setNoteDraft(previousNote);
      showToast("Could not save the note — please try again.", { ok: false });
    } finally {
      setNoteSaving(false);
    }
  };

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

  if (fetchError && messages.length === 0 && !refetching)
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-zinc-200 p-8 text-center max-w-sm w-full rounded-lg">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-black text-zinc-900 mb-1">Failed to load messages</h2>
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
        <div className="relative px-6 md:px-12 py-10 max-w-7xl mx-auto">
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">
            Customer Communication
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight flex items-center gap-3 flex-wrap">
            Contact Messages
            {unseenCount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/25 text-sky-300 px-3 py-1 text-[11px] font-bold tracking-widest uppercase rounded-full align-middle">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                {unseenCount} unseen
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Every submission from the public Contact Us form — respond and track resolution.
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 -mt-8 max-w-7xl mx-auto relative z-10">
        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total Messages", value: counts.all, sub: "Matching current search" },
            { label: "New", value: counts.new, sub: "Awaiting first response" },
            { label: "In Progress", value: counts.in_progress, sub: "Being handled" },
            { label: "Resolved", value: counts.resolved, sub: "Closed out" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-100 p-5 rounded-lg">
              <p className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight mb-0.5">{s.value}</p>
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{s.label}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

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
              placeholder="Search name, email, ref, or message…"
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
        ) : messages.length === 0 ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center">
            <Inbox size={26} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-black text-zinc-900 mb-1">No messages here</p>
            <p className="text-xs text-zinc-400">
              {!search.trim() && counts.all === 0
                ? "Messages appear the moment someone submits the Contact Us form."
                : "Try a different filter or search."}
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
            {/* Left — message list */}
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
              {liveNewCount > 0 && (
                <button
                  onClick={() => goToPage(1)}
                  className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold tracking-wide py-2.5 transition-colors"
                >
                  <Sparkles size={12} />
                  {liveNewCount} new message{liveNewCount > 1 ? "s" : ""} — click to refresh
                </button>
              )}
              <div className="divide-y divide-zinc-100 max-h-[65vh] overflow-y-auto">
                {messages.map((m) => {
                  const st = STATUS_META[m.status] || STATUS_META.new;
                  const tp = TOPIC_META[m.topic] || TOPIC_META.other;
                  const isSel = selected?._id === m._id;
                  const unseen = !m.adminViewed;
                  return (
                    <button
                      key={m._id}
                      onClick={() => openMessage(m)}
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
                        {initials(m.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-[13px] truncate ${unseen ? "font-black" : "font-semibold"} ${isSel ? "text-white" : "text-zinc-900"}`}>
                            {m.name}
                          </span>
                          <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${st.cls}`}>
                            {st.label}
                          </span>
                        </span>
                        <span className={`block text-[11.5px] truncate mt-0.5 ${isSel ? "text-zinc-400" : "text-zinc-500"}`}>
                          {tp.label} · {m.referenceNumber}
                        </span>
                        <span className={`block text-[10.5px] mt-0.5 ${isSel ? "text-zinc-500" : "text-zinc-400"}`}>
                          {fmtDateTime(m.createdAt)}
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
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Tag size={12} /> {selected.referenceNumber}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={12} /> {fmtDateTime(selected.createdAt)}
                      </span>
                    </p>
                  </div>
                  {(() => {
                    const tp = TOPIC_META[selected.topic] || TOPIC_META.other;
                    const TIcon = tp.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold flex-shrink-0 ${tp.cls}`}>
                        <TIcon size={12} /> {tp.label}
                      </span>
                    );
                  })()}
                </div>

                {/* pipeline */}
                <div className="px-6 md:px-7 py-5 border-b border-zinc-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-3">
                    Status
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

                {/* contact details */}
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
                  {selected.phone && (
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
                  )}
                  {selected.address && (
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
                        <MapPin size={14} className="text-zinc-500" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400">Address</span>
                        <span className="block text-[13px] font-semibold text-zinc-900">{selected.address}</span>
                      </span>
                    </div>
                  )}
                  {selected.bookingNumber && (
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
                        <CalendarDays size={14} className="text-zinc-500" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400">Booking No.</span>
                        <span className="block text-[13px] font-mono font-semibold text-zinc-900">{selected.bookingNumber}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* message */}
                <div className="px-6 md:px-7 py-5 border-b border-zinc-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2.5 flex items-center gap-2">
                    <MessageSquareText size={11} /> Message
                  </p>
                  <p className="text-[13.5px] leading-7 text-zinc-700 bg-[#fafafa] border border-zinc-100 rounded-lg px-5 py-4 whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>

                {/* internal admin note */}
                <div className="px-6 md:px-7 py-5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2.5">
                    Internal note <span className="normal-case font-medium text-zinc-400">(not visible to sender)</span>
                  </p>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    placeholder="Add context for the team — e.g. what was done, who followed up…"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    className="w-full resize-y rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                  <div className="mt-2.5 flex items-center gap-3">
                    <button
                      onClick={saveNote}
                      disabled={noteSaving || noteDraft === (selected.adminNote || "")}
                      className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {noteSaving && <Loader2 size={11} className="animate-spin" />}
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center bg-white border border-dashed border-zinc-200 rounded-lg py-24 text-center">
                <MousePointerClick size={26} className="text-zinc-200 mb-3" />
                <p className="text-sm font-black text-zinc-900 mb-1">Select a message</p>
                <p className="text-xs text-zinc-400 max-w-[220px]">
                  Click anyone in the list to see their full message here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
