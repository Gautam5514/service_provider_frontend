"use client";

import { use, useEffect, useRef, useState } from "react";
import BrandLoader from "@/components/BrandLoader";
import Link from "next/link";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getSocket, ensureSocket } from "@/lib/socket";
import { refreshAdminBadges } from "@/lib/adminBadges";
import {
  ArrowLeft, CheckCircle2, Loader2,
  Lock, Send, User, XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  open:        { label: "Open",        bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  in_progress: { label: "In Progress", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"  },
  resolved:    { label: "Resolved",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  closed:      { label: "Closed",      bg: "bg-zinc-100",   text: "text-zinc-500",    border: "border-zinc-200"  },
};

function fmtTime(d) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AdminSupportChatPage({ params }) {
  const { ticketId } = use(params);
  const myUser       = getStoredUser();
  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);

  const [ticket,   setTicket]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newMsg,   setNewMsg]   = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState("");
  const [acting,   setActing]   = useState(false);

  // Load ticket + messages
  useEffect(() => {
    api.get(`/support/${ticketId}`)
      .then(({ data }) => {
        if (data.success) {
          setTicket(data.ticket);
          setMessages(data.messages);
          // Opening a ticket resets its unreadByAdmin count server-side —
          // tell the sidebar to refresh its badge count now.
          refreshAdminBadges();
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ticketId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time listener
  useEffect(() => {
    let mounted = true;
    let bound   = null;

    async function setup() {
      const s = getSocket() || await ensureSocket();
      if (!s || !mounted) return;

      const handler = (data) => {
        if (String(data.ticketId) !== String(ticketId)) return;
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(data.message._id))) return prev;
          return [...prev, data.message];
        });
      };

      const statusHandler = (data) => {
        if (String(data.ticketId) === String(ticketId)) {
          setTicket(prev => prev ? { ...prev, status: data.status } : prev);
        }
      };

      s.on("support:message:new",   handler);
      s.on("support:ticket:status", statusHandler);
      bound = { socket: s, handler, statusHandler };
    }

    setup();
    return () => {
      mounted = false;
      if (bound) {
        bound.socket.off("support:message:new",   bound.handler);
        bound.socket.off("support:ticket:status", bound.statusHandler);
      }
    };
  }, [ticketId]);

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = newMsg.trim();
    if (!text || sending) return;
    if (ticket?.status === "resolved" || ticket?.status === "closed") return;

    const tempId  = `tmp-${Date.now()}`;
    const tempMsg = {
      _id:        tempId,
      senderRole: "admin",
      senderName: myUser?.fullName || "Support",
      text,
      createdAt:  new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMsg("");
    setSending(true);
    setError("");

    try {
      const { data } = await api.post(`/support/${ticketId}/message`, { text });
      if (data.success) {
        // The server also echoes this message back over the socket to every
        // admin room (including this one), so it may already have been
        // appended by the socket handler by the time this resolves — drop
        // the temp placeholder without adding a duplicate.
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m._id !== tempId);
          const alreadyPresent = withoutTemp.some(m => String(m._id) === String(data.message._id));
          return alreadyPresent ? withoutTemp : [...withoutTemp, data.message];
        });
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setError(err.response?.data?.message || "Failed to send. Please try again.");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const changeStatus = async (status) => {
    setActing(true);
    try {
      const { data } = await api.put(`/support/${ticketId}/status`, { status });
      if (data.success) setTicket(prev => ({ ...prev, status }));
    } catch { /* silent */ }
    finally { setActing(false); }
  };

  const isClosed = ticket?.status === "resolved" || ticket?.status === "closed";
  const st       = STATUS_CONFIG[ticket?.status] || STATUS_CONFIG.open;

  if (loading) return <BrandLoader fullScreen />;

  return (
    <div className="bg-[#f7f7f8] font-sans selection:bg-black selection:text-white">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      {/* Sticky within the admin dashboard's own scroll container (SidebarInset),
          offset below its topbar (h-16) on desktop — this page has no scroll
          container of its own, unlike the standalone /support/[id] page. */}
      <div className="sticky top-0 md:top-16 z-20 bg-zinc-950 text-white">
        <div className="px-6 md:px-10 py-4 flex items-center gap-4">
          <Link href="/admin/support"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/15 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={15} />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-bold tracking-widests uppercase text-zinc-500">{ticket?.ticketNumber}</span>
              <span className={`text-[9px] font-bold tracking-widests uppercase px-2 py-0.5 border rounded-full ${st.bg} ${st.text} ${st.border}`}>
                {st.label}
              </span>
            </div>
            <p className="text-sm font-extrabold text-white truncate mt-0.5">{ticket?.subject}</p>
            {ticket?.userId?.fullName && (
              <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <User size={10} /> {ticket.userId.fullName}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                  ticket.userRole === "provider" ? "bg-violet-500/20 text-violet-300" : "bg-sky-500/20 text-sky-300"
                }`}>
                  {ticket.userRole === "provider" ? "Partner" : "Customer"}
                </span>
                {ticket.userId?.email && ` · ${ticket.userId.email}`}
              </p>
            )}
          </div>

          {/* Status actions */}
          {!isClosed && (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => changeStatus("resolved")} disabled={acting}
                className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 text-[10px] font-bold tracking-widests uppercase rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50">
                <CheckCircle2 size={12} /> Resolve
              </button>
              <button onClick={() => changeStatus("closed")} disabled={acting}
                className="flex items-center gap-1.5 bg-zinc-700 text-white px-3 py-2 text-[10px] font-bold tracking-widests uppercase rounded-full hover:bg-zinc-600 transition-colors disabled:opacity-50">
                <XCircle size={12} /> Close
              </button>
            </div>
          )}
          {isClosed && (
            <button onClick={() => changeStatus("open")} disabled={acting}
              className="flex items-center gap-1.5 bg-white/10 text-zinc-300 px-3 py-2 text-[10px] font-bold tracking-widests uppercase rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 shrink-0">
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="bg-white min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-3">

          {/* Ticket info banner */}
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widests text-zinc-400 mb-1">{ticket?.categoryLabel}</p>
            <p className="text-sm font-extrabold text-zinc-900">{ticket?.subject}</p>
          </div>

          {/* Linked booking */}
          {ticket?.bookingId?.bookingNumber && (
            <div className="flex items-center justify-between gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400">Linked Booking</p>
                <p className="text-xs font-bold text-zinc-800 truncate">
                  {ticket.bookingId.bookingNumber} · {ticket.bookingId.serviceName}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{ticket.bookingId.status}</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  ticket.bookingId.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {ticket.bookingId.paymentStatus}
                </span>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            // From admin's perspective: admin messages on right, customer on left
            const isMe      = msg.senderRole === "admin";
            const showName  = i === 0 || messages[i - 1]?.senderRole !== msg.senderRole;

            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  {showName && (
                    <p className={`text-[10px] font-bold text-zinc-400 px-1 ${isMe ? "text-right" : "text-left"}`}>
                      {isMe ? "You (Support)" : msg.senderName}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                    isMe
                      ? "bg-zinc-900 text-white rounded-2xl rounded-br-md"
                      : "bg-zinc-100 text-zinc-900 rounded-2xl rounded-bl-md"
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] text-zinc-400 px-1 ${isMe ? "text-right" : "text-left"}`}>
                    {fmtTime(msg.createdAt)}
                    {String(msg._id).startsWith("tmp-") && <span className="ml-1 text-zinc-300">Sending…</span>}
                  </p>
                </div>
              </div>
            );
          })}

          {isClosed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">
                Ticket {ticket.status} — customer has been notified.
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Reply area ───────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 bg-white border-t border-zinc-100">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4">
          {error && <p className="text-[11px] text-red-600 font-semibold mb-2">{error}</p>}

          {isClosed ? (
            <div className="flex items-center justify-center gap-2 py-2 text-zinc-400">
              <Lock size={14} />
              <p className="text-xs font-semibold">Ticket is {ticket?.status}</p>
              <button onClick={() => changeStatus("open")}
                className="ml-2 text-xs font-bold text-black hover:underline underline-offset-2">
                Reopen →
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={newMsg}
                onChange={e => {
                  setNewMsg(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Reply to customer… (Enter to send)"
                className="flex-1 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:border-black transition-colors resize-none placeholder:text-zinc-300 min-h-[44px]"
                style={{ height: "44px" }}
                disabled={sending}
              />
              <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                className="w-11 h-11 bg-zinc-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors disabled:opacity-40 shrink-0">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
