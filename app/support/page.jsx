"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  AlertCircle, ArrowRight, CheckCircle2,
  Clock, MessageSquare, Plus, RefreshCw,
} from "lucide-react";

const STATUS_CONFIG = {
  open:        { label: "Open",        bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400 animate-pulse" },
  in_progress: { label: "In Progress", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"  },
  resolved:    { label: "Resolved",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  closed:      { label: "Closed",      bg: "bg-zinc-100",   text: "text-zinc-500",    border: "border-zinc-200",    dot: "bg-zinc-400"  },
};

function fmtTime(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SupportListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = () => {
    const user = getStoredUser();
    if (!user) { router.replace("/login?redirect=/support"); return; }
    setLoading(true);
    setError(false);
    api.get("/support")
      .then(({ data }) => { if (data.success) setTickets(data.tickets); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white pb-16">

      {/* Header */}
      <div className="bg-zinc-950 text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">Help Desk</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Support Tickets</h1>
          <p className="text-zinc-400 text-sm">Track and continue your conversations with our support team.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-4">

        {/* New ticket CTA */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widests uppercase text-zinc-400">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => document.querySelector("[aria-label='Support']")?.click()}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] font-bold tracking-widests uppercase hover:bg-zinc-800 transition-colors rounded-md"
          >
            <Plus size={12} /> New Ticket
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-100 rounded-lg h-20 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="font-bold text-zinc-900 mb-4">Could not load tickets</p>
            <button onClick={load}
              className="flex items-center gap-2 mx-auto text-[10px] font-bold tracking-widests uppercase bg-black text-white px-5 py-2.5 rounded-md hover:bg-zinc-800 transition-colors">
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="bg-white border border-dashed border-zinc-200 rounded-lg p-14 text-center">
            <MessageSquare size={36} className="text-zinc-200 mx-auto mb-4" />
            <p className="font-extrabold text-zinc-900 mb-2">No support tickets yet</p>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
              Have an issue? Click the chat button in the bottom-right to get help from our team.
            </p>
          </div>
        )}

        {!loading && !error && tickets.map(ticket => {
          const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.closed;
          const hasUnread = (ticket.unreadByCustomer || 0) > 0;
          return (
            <Link key={ticket._id} href={`/support/${ticket._id}`}>
              <div className={`group bg-white border rounded-lg p-5 hover:border-zinc-300 hover:shadow-md transition-all duration-200 cursor-pointer ${hasUnread ? "border-blue-200" : "border-zinc-100"}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${hasUnread ? "bg-blue-50 border border-blue-100" : "bg-zinc-50 border border-zinc-100"}`}>
                    <MessageSquare size={17} className={hasUnread ? "text-blue-600" : "text-zinc-400"} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[9px] font-bold tracking-widests uppercase text-zinc-400">{ticket.ticketNumber}</span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-widests uppercase px-2 py-0.5 rounded-md border ${st.bg} ${st.text} ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      {hasUnread && (
                        <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                          {ticket.unreadByCustomer} new
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-zinc-900 truncate mb-0.5">{ticket.subject}</p>
                    <p className="text-[10px] font-semibold text-zinc-400">{ticket.categoryLabel}</p>
                    {ticket.lastMessage && (
                      <p className="text-xs text-zinc-400 mt-1 truncate">
                        {ticket.lastMessage.senderRole === "admin" ? "Support: " : "You: "}
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
  );
}
