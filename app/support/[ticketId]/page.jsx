"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getSocket, ensureSocket } from "@/lib/socket";
import {
  ArrowLeft, CheckCircle2, Loader2, Lock, Send,
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

export default function SupportChatPage({ params }) {
  const { ticketId } = use(params);
  const router       = useRouter();
  const myUser       = getStoredUser();
  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);

  const [ticket,   setTicket]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newMsg,   setNewMsg]   = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState("");

  // ── Load ticket + messages ──────────────────────────────────────────────────
  useEffect(() => {
    if (!myUser) { router.replace("/login"); return; }
    api.get(`/support/${ticketId}`)
      .then(({ data }) => {
        if (data.success) {
          setTicket(data.ticket);
          setMessages(data.messages);
        }
      })
      .catch(() => router.replace("/support"))
      .finally(() => setLoading(false));
  }, [ticketId, router]);

  // ── Auto-scroll on new messages ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Real-time socket listener ───────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let bound   = null;

    async function setup() {
      const s = getSocket() || await ensureSocket();
      if (!s || !mounted) return;

      const handler = (data) => {
        if (String(data.ticketId) !== String(ticketId)) return;
        setMessages(prev => {
          // Deduplicate — sent messages are added optimistically
          if (prev.some(m => String(m._id) === String(data.message._id))) return prev;
          return [...prev, data.message];
        });
      };

      s.on("support:message:new",    handler);
      s.on("support:ticket:status",  (data) => {
        if (String(data.ticketId) === String(ticketId)) {
          setTicket(prev => prev ? { ...prev, status: data.status } : prev);
        }
      });

      bound = { socket: s, handler };
    }

    setup();
    return () => {
      mounted = false;
      if (bound) bound.socket.off("support:message:new", bound.handler);
    };
  }, [ticketId]);

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = newMsg.trim();
    if (!text || sending) return;
    if (ticket?.status === "resolved" || ticket?.status === "closed") return;

    // Optimistic update
    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      _id:        tempId,
      senderRole: "customer",
      senderName: myUser?.fullName || "You",
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
        // Replace temp message with real one
        setMessages(prev => prev.map(m =>
          m._id === tempId ? { ...data.message } : m
        ));
      }
    } catch (err) {
      // Remove temp message and show error
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setError(err.response?.data?.message || "Failed to send. Please try again.");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = ticket?.status === "resolved" || ticket?.status === "closed";

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <Loader2 size={28} className="text-zinc-400 animate-spin" />
    </div>
  );

  const st = STATUS_CONFIG[ticket?.status] || STATUS_CONFIG.open;

  return (
    <div className="flex flex-col h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white">

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <div className="bg-zinc-950 text-white shrink-0">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <Link href="/support"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 text-zinc-400 hover:bg-white/15 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={15} />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[9px] font-bold tracking-widests uppercase text-zinc-500">{ticket?.ticketNumber}</p>
              <span className={`text-[9px] font-bold tracking-widests uppercase px-2 py-0.5 border rounded-md ${st.bg} ${st.text} ${st.border}`}>
                {st.label}
              </span>
            </div>
            <p className="text-sm font-extrabold text-white truncate mt-0.5">{ticket?.categoryLabel || "Support"}</p>
          </div>

          {/* Support team avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-white text-xs font-black shrink-0" title="Support Team">
            S
          </div>
        </div>
      </div>

      {/* ── Messages area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-3">

          {/* Ticket subject + opening info */}
          <div className="bg-white border border-zinc-100 rounded-lg p-4 text-center mb-2 shadow-sm">
            <p className="text-xs text-zinc-400 font-medium mb-1">Support request opened</p>
            <p className="text-sm font-extrabold text-zinc-900">{ticket?.subject}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{ticket?.categoryLabel}</p>
          </div>

          {messages.map((msg, i) => {
            const isMe = msg.senderRole === "customer";
            const showName = i === 0 || messages[i - 1]?.senderRole !== msg.senderRole;

            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {showName && (
                    <p className={`text-[10px] font-bold text-zinc-400 px-1 ${isMe ? "text-right" : "text-left"}`}>
                      {isMe ? "You" : msg.senderName}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                    isMe
                      ? "bg-zinc-900 text-white rounded-2xl rounded-br-md"
                      : "bg-white border border-zinc-100 text-zinc-900 rounded-2xl rounded-bl-md shadow-sm"
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] text-zinc-400 px-1 ${isMe ? "text-right" : "text-left"}`}>
                    {fmtTime(msg.createdAt)}
                    {String(msg._id).startsWith("tmp-") && (
                      <span className="ml-1.5 text-zinc-300">Sending…</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Closed/Resolved banner */}
          {isClosed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">
                This ticket has been {ticket.status}. Open a new ticket if you need further help.
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input area ───────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-zinc-100 shrink-0">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4">
          {error && (
            <p className="text-[11px] text-red-600 font-semibold mb-2">{error}</p>
          )}

          {isClosed ? (
            <div className="flex items-center justify-center gap-2 py-2 text-zinc-400">
              <Lock size={14} />
              <p className="text-xs font-semibold">This ticket is closed</p>
              <Link href="/support" className="ml-2 text-xs font-bold text-black hover:underline underline-offset-2">
                Open new ticket →
              </Link>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={newMsg}
                onChange={e => {
                  setNewMsg(e.target.value);
                  // Auto-grow (max 5 rows)
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                className="flex-1 border border-zinc-200 rounded-md px-4 py-3 text-sm text-black focus:outline-none focus:border-black transition-colors resize-none placeholder:text-zinc-300 min-h-[44px]"
                style={{ height: "44px" }}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMsg.trim()}
                className="w-11 h-11 bg-zinc-900 text-white rounded-md flex items-center justify-center hover:bg-black transition-colors disabled:opacity-40 shrink-0"
              >
                {sending
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Send size={16} />}
              </button>
            </div>
          )}
          <p className="text-[9px] text-zinc-400 mt-1.5 font-medium">
            Our support team typically responds within a few hours.
          </p>
        </div>
      </div>
    </div>
  );
}
