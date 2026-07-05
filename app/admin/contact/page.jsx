"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  CreditCard,
  Frown,
  Inbox,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
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

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data } = await api.get("/contact/admin");
      setMessages(data.messages || []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = messages;
    if (filter !== "all") list = list.filter((m) => m.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.referenceNumber.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, filter, query]);

  const selected = useMemo(
    () => filtered.find((m) => m._id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  useEffect(() => {
    setNoteDraft(selected?.adminNote || "");
    setNoteSaved(false);
  }, [selected?._id]);

  const counts = useMemo(() => {
    const c = { all: messages.length, new: 0, in_progress: 0, resolved: 0 };
    for (const m of messages) c[m.status] = (c[m.status] || 0) + 1;
    return c;
  }, [messages]);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/contact/admin/${id}/status`, { status });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
    } catch {
      alert("Could not update the message status.");
    }
  };

  const saveNote = async () => {
    try {
      await api.put(`/contact/admin/${selected._id}/note`, { adminNote: noteDraft });
      setMessages((prev) =>
        prev.map((m) => (m._id === selected._id ? { ...m, adminNote: noteDraft } : m))
      );
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1800);
    } catch {
      alert("Could not save the note.");
    }
  };

  if (fetchError)
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-zinc-200 p-8 text-center max-w-sm w-full rounded-lg">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-black text-zinc-900 mb-1">Failed to load messages</h2>
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
        <div className="relative px-6 md:px-12 py-10 max-w-7xl mx-auto">
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">
            Customer Communication
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Contact Messages
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
            { label: "Total Messages", value: counts.all, sub: "All time received" },
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
                  onClick={() => { setFilter(s); setSelectedId(null); }}
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
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
              className="w-full border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* ── Split view ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center text-xs text-zinc-400 font-semibold">
            Loading messages…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center">
            <Inbox size={26} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-black text-zinc-900 mb-1">No messages here</p>
            <p className="text-xs text-zinc-400">
              {messages.length === 0
                ? "Messages appear the moment someone submits the Contact Us form."
                : "Try a different filter or search."}
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
            {/* Left — message list */}
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100 max-h-[70vh] overflow-y-auto">
              {filtered.map((m) => {
                const st = STATUS_META[m.status] || STATUS_META.new;
                const tp = TOPIC_META[m.topic] || TOPIC_META.other;
                const isSel = selected?._id === m._id;
                return (
                  <button
                    key={m._id}
                    onClick={() => setSelectedId(m._id)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                      isSel ? "bg-zinc-950" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                        isSel ? "bg-[#C8A45C] text-black" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {initials(m.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] font-black truncate ${isSel ? "text-white" : "text-zinc-900"}`}>
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
                      className="bg-black text-white px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Save Note
                    </button>
                    {noteSaved && <span className="text-[11px] font-semibold text-emerald-600">Saved</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
