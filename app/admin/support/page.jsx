"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { getSocket, ensureSocket } from "@/lib/socket";
import {
  AlertCircle, ArrowRight, CheckCircle2,
  Clock, MessageSquare, RefreshCw, User,
} from "lucide-react";

const STATUS_CONFIG = {
  open:        { label: "Open",        bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400 animate-pulse" },
  in_progress: { label: "In Progress", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"  },
  resolved:    { label: "Resolved",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  closed:      { label: "Closed",      bg: "bg-zinc-100",   text: "text-zinc-500",    border: "border-zinc-200",    dot: "bg-zinc-400"  },
};

const STATUS_TABS = [
  { key: "all",        label: "All" },
  { key: "open",       label: "Open" },
  { key: "in_progress",label: "In Progress" },
  { key: "resolved",   label: "Resolved" },
  { key: "closed",     label: "Closed" },
];

const ROLE_TABS = [
  { key: "all",      label: "All" },
  { key: "customer", label: "Customers" },
  { key: "provider", label: "Partners" },
];

function fmtTime(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function AdminSupportPage() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [statusTab,setStatusTab]= useState("all");
  const [roleTab,  setRoleTab]  = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (statusTab !== "all") params.set("status", statusTab);
      if (roleTab   !== "all") params.set("role", roleTab);
      const qs = params.toString();
      const { data } = await api.get(`/support/admin${qs ? `?${qs}` : ""}`);
      if (data.success) setTickets(data.tickets);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [statusTab, roleTab]);

  useEffect(() => { load(); }, [load]);

  // Real-time: new tickets + new messages update the list
  useEffect(() => {
    let mounted = true;
    let bound   = null;

    async function setup() {
      const s = getSocket() || await ensureSocket();
      if (!s || !mounted) return;

      const onNewTicket = (data) => {
        setTickets(prev => [{
          _id:          data.ticketId,
          ticketNumber: data.ticketNumber,
          subject:      data.subject,
          categoryLabel:data.category,
          status:       "open",
          unreadByAdmin:1,
          lastMessageAt:data.createdAt,
          userId:       { fullName: data.userName },
          userRole:     data.userRole,
          bookingId:    data.bookingNumber ? { bookingNumber: data.bookingNumber } : null,
        }, ...prev]);
      };

      const onNewMessage = (data) => {
        setTickets(prev => prev.map(t =>
          String(t._id) === String(data.ticketId)
            ? {
                ...t,
                lastMessageAt: new Date().toISOString(),
                lastMessage:   { text: data.message.text, senderRole: data.message.senderRole },
                unreadByAdmin: data.message.senderRole !== "admin"
                  ? (t.unreadByAdmin || 0) + 1
                  : t.unreadByAdmin,
              }
            : t
        ));
      };

      s.on("support:ticket:created", onNewTicket);
      s.on("support:message:new",    onNewMessage);
      bound = { socket: s, onNewTicket, onNewMessage };
    }

    setup();
    return () => {
      mounted = false;
      if (bound) {
        bound.socket.off("support:ticket:created", bound.onNewTicket);
        bound.socket.off("support:message:new",    bound.onNewMessage);
      }
    };
  }, []);

  const counts = {
    open:        tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    unread:      tickets.reduce((s, t) => s + (t.unreadByAdmin || 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] pb-16 font-sans selection:bg-black selection:text-white">

      {/* Dark header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white pb-12">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="relative px-6 md:px-12 py-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">Customer Relations</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Support Inbox</h1>
            {counts.unread > 0 && (
              <p className="text-sm text-emerald-400 font-semibold mt-1">
                {counts.unread} unread message{counts.unread !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 -mt-8 max-w-7xl mx-auto relative z-10 space-y-5">

        {/* Status filter */}
        <div className="flex flex-wrap gap-1 bg-white rounded-lg border border-zinc-100 p-1 w-fit shadow-sm">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold tracking-widests uppercase rounded-md transition-all ${
                statusTab === tab.key ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700"
              }`}>
              {tab.label}
              {tab.key === "open" && counts.open > 0 && (
                <span className="bg-amber-400 text-zinc-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">{counts.open}</span>
              )}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <div className="flex flex-wrap gap-1 bg-white rounded-lg border border-zinc-100 p-1 w-fit shadow-sm">
          {ROLE_TABS.map(tab => (
            <button key={tab.key} onClick={() => setRoleTab(tab.key)}
              className={`px-4 py-2 text-[10px] font-bold tracking-widests uppercase rounded-md transition-all ${
                roleTab === tab.key ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-zinc-100 h-20 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="font-bold text-zinc-900 mb-3">Failed to load support tickets</p>
            <button onClick={load}
              className="flex items-center gap-2 mx-auto text-[10px] font-bold tracking-widests uppercase bg-black text-white px-5 py-2.5 rounded-md">
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <div className="bg-white border border-dashed border-zinc-200 rounded-lg p-14 text-center">
            <CheckCircle2 size={36} className="text-zinc-200 mx-auto mb-4" />
            <p className="font-extrabold text-zinc-900 mb-1">All clear!</p>
            <p className="text-sm text-zinc-400">No support tickets in this category.</p>
          </div>
        )}

        {/* Ticket list */}
        {!loading && !error && tickets.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-widests uppercase text-zinc-400 mb-3">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {tickets.map(ticket => {
                const st      = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const hasUnread = (ticket.unreadByAdmin || 0) > 0;
                return (
                  <Link key={ticket._id} href={`/admin/support/${ticket._id}`}>
                    <div className={`group bg-white border rounded-lg p-5 hover:border-zinc-300 hover:shadow-md transition-all duration-200 cursor-pointer ${hasUnread ? "border-amber-200" : "border-zinc-100"}`}>
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${hasUnread ? "bg-amber-50 border border-amber-100" : "bg-zinc-50 border border-zinc-100"}`}>
                          <MessageSquare size={17} className={hasUnread ? "text-amber-600" : "text-zinc-400"} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[9px] font-bold tracking-widests uppercase text-zinc-400">{ticket.ticketNumber}</span>
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-widests uppercase px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                            {hasUnread && (
                              <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                {ticket.unreadByAdmin} new
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-zinc-900 truncate mb-0.5">{ticket.subject}</p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium flex-wrap">
                            <User size={10} />
                            <span>{ticket.userId?.fullName || "User"}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                              ticket.userRole === "provider" ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-600"
                            }`}>
                              {ticket.userRole === "provider" ? "Partner" : "Customer"}
                            </span>
                            <span>·</span>
                            <span>{ticket.categoryLabel}</span>
                            {ticket.bookingId?.bookingNumber && (
                              <>
                                <span>·</span>
                                <span>Booking {ticket.bookingId.bookingNumber}</span>
                              </>
                            )}
                          </div>
                          {ticket.lastMessage && (
                            <p className="text-xs text-zinc-400 mt-1 truncate">
                              {ticket.lastMessage.senderRole === "admin" ? "You: " : `${ticket.userRole === "provider" ? "Partner" : "Customer"}: `}
                              {ticket.lastMessage.text}
                            </p>
                          )}
                        </div>

                        {/* Right */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Clock size={10} /> {fmtTime(ticket.lastMessageAt || ticket.createdAt)}
                          </p>
                          <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-700 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
