"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  AlertCircle,
  BriefcaseBusiness,
  ClipboardCheck,
  CreditCard,
  History,
  MousePointer2,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
  X,
  // Premium visual icons
  Snowflake,
  Fan,
  Refrigerator,
  Zap,
  TrendingUp,
  ArrowRight,
  LayoutDashboard,
  Percent,
  Clock,
  ShieldAlert,
  Award,
  Filter,
  CheckCircle2,
  UserCheck,
  Activity,
  Star,
  DollarSign,
  ChevronRight,
} from "lucide-react";

// ─── Predefined Client-Side Fallback Databases ("Lovely Data") ────────────────

const LOCAL_SERVICES = [
  {
    id: "ac-repair",
    type: "service",
    label: "AC High-Performance Repair & Gas Refill",
    meta: "AC · Starts ₹499 · Diagnostics, coolant charging, and expert fix",
    category: "ac",
    tags: ["popular", "ac", "gas refill", "repair", "summer", "cool"],
    href: "/book/ac-repair",
  },
  {
    id: "ac-cleaning",
    type: "service",
    label: "AC Deep Jet Cleaning & Service",
    meta: "AC · Starts ₹599 · Eco-friendly coil wash & air flow optimization",
    category: "ac",
    tags: ["cleaning", "ac", "service", "maintenance", "jet wash"],
    href: "/book/ac-cleaning",
  },
  {
    id: "fan-install",
    type: "service",
    label: "Ceiling & Wall Fan Installation",
    meta: "Electrical · Starts ₹199 · Secure mounting & wall-controller setup",
    category: "electrical",
    tags: ["fan", "install", "wiring", "mounting", "regulator"],
    href: "/book/fan-install",
  },
  {
    id: "fridge-gas",
    type: "service",
    label: "Advanced Refrigerator Repair & Diagnostics",
    meta: "Fridge · Starts ₹1499 · Compressor repair and leakage fix",
    category: "fridge",
    tags: ["fridge", "refrigerator", "leak", "compressor", "cooling"],
    href: "/book/fridge-gas",
  },
  {
    id: "tv-mounting",
    type: "service",
    label: "Smart TV Wall Mounting & Setup",
    meta: "Appliance · Starts ₹349 · Perfect leveling & wire concealment",
    category: "appliance",
    tags: ["tv", "mounting", "wall", "brackets", "led"],
    href: "/book/tv-mounting",
  },
  {
    id: "electrical-audit",
    type: "service",
    label: "Complete Home Electrical Safety Inspection",
    meta: "Electrical · Starts ₹799 · Switchboard, earthing, & safety audit",
    category: "electrical",
    tags: ["wiring", "electrical", "safety", "switchboard", "short circuit"],
    href: "/book/electrical-audit",
  },
  {
    id: "inverter-setup",
    type: "service",
    label: "Inverter & Battery System Setup",
    meta: "Electrical · Starts ₹899 · Power back-up config & load diagnostics",
    category: "electrical",
    tags: ["inverter", "battery", "power backup", "wiring", "home"],
    href: "/book/inverter-setup",
  },
  {
    id: "geyser-repair",
    type: "service",
    label: "Geyser Heating Element Repair & Service",
    meta: "Appliance · Starts ₹549 · Thermostat replacement & scaling clean",
    category: "appliance",
    tags: ["geyser", "heating", "water", "repair", "winter"],
    href: "/book/geyser-repair",
  }
];

const PROVIDER_ACTIONS = [
  {
    id: "prov-orders",
    type: "action",
    label: "View Active Orders & Bookings",
    meta: "Partner Portal · Track pending, active, and travelling jobs",
    tags: ["active", "orders", "jobs", "bookings", "schedule", "today"],
    href: "/dashboard/provider/orders",
    icon: BriefcaseBusiness,
    themeColor: "emerald"
  },
  {
    id: "prov-completed",
    type: "action",
    label: "Earnings Charts & Completed Payouts",
    meta: "Partner Portal · Inspect weekly earnings, payouts, and history",
    tags: ["completed", "done", "earnings", "money", "history", "payouts"],
    href: "/dashboard/provider/completed",
    icon: DollarSign,
    themeColor: "amber"
  },
  {
    id: "prov-profile",
    type: "action",
    label: "Manage Services Profile & Rates",
    meta: "Partner Portal · Edit your skills, service pricing, and cities",
    tags: ["profile", "kyc", "services", "onboarding", "skills", "edit"],
    href: "/dashboard/provider/profile",
    icon: Wrench,
    themeColor: "indigo"
  },
  {
    id: "prov-reviews",
    type: "action",
    label: "Customer Rating Analytics & Feedback",
    meta: "Partner Portal · Read verified customer reviews & star history",
    tags: ["reviews", "ratings", "feedback", "stars", "comments"],
    href: "/dashboard/provider/profile",
    icon: Star,
    themeColor: "rose"
  }
];

const ADMIN_ACTIONS = [
  {
    id: "adm-providers",
    type: "action",
    label: "Review Registered Providers Registry",
    meta: "Admin Center · Search, verify, or block service professionals",
    tags: ["providers", "verification", "list", "kyc", "approved"],
    href: "/admin/providers",
    icon: ShieldCheck,
    themeColor: "emerald"
  },
  {
    id: "adm-approved",
    type: "action",
    label: "Approve Pending Partner Onboardings",
    meta: "Admin Center · Process applicant KYC and background verification",
    tags: ["pending", "approvals", "onboarding", "new", "status"],
    href: "/admin/approved",
    icon: UserCheck,
    themeColor: "amber"
  },
  {
    id: "adm-coupons",
    type: "action",
    label: "Manage Discount Coupons & Offers",
    meta: "Admin Center · Create promotional codes and referral schemes",
    tags: ["coupons", "promo", "discounts", "offers", "sales"],
    href: "/admin/coupons",
    icon: Percent,
    themeColor: "blue"
  },
  {
    id: "adm-support",
    type: "action",
    label: "Helpdesk & Customer Dispute Center",
    meta: "Admin Center · Moderate active claims, support tickets, and disputes",
    tags: ["support", "tickets", "complaints", "help", "disputes"],
    href: "/admin/support",
    icon: ShieldAlert,
    themeColor: "red"
  },
  {
    id: "adm-services",
    type: "action",
    label: "Configure Service Catalog & base rates",
    meta: "Admin Center · Add categories, edit prices, edit descriptions",
    tags: ["services", "catalog", "categories", "pricing", "rates"],
    href: "/admin/services",
    icon: Wrench,
    themeColor: "purple"
  }
];

// Local fuzzy search filter based on role
function searchLocal(q, userRole) {
  const cleanQ = q.toLowerCase().trim();
  if (cleanQ.length < 2) return [];

  let candidates = [];
  if (userRole === "admin") {
    candidates = [...ADMIN_ACTIONS, ...LOCAL_SERVICES];
  } else if (userRole === "provider") {
    candidates = PROVIDER_ACTIONS;
  } else {
    candidates = LOCAL_SERVICES;
  }

  return candidates.filter(item => {
    const labelMatch = (item.label || "").toLowerCase().includes(cleanQ);
    const metaMatch  = (item.meta  || "").toLowerCase().includes(cleanQ);
    const tagMatch   = (item.tags  || []).some(t => t.toLowerCase().includes(cleanQ));
    return labelMatch || metaMatch || tagMatch;
  });
}

// ─── Role config ───────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  customer: {
    label:       "Elite Search Hub",
    placeholder: "Search AC repair, wiring, past orders...",
    endpoint:    "/search",
    chips:       ["AC repair", "Fan install", "completed", "today"],
  },
  provider: {
    label:       "Partner Spotlight Portal",
    placeholder: "Search active orders, payout status, clients...",
    endpoint:    "/search",
    chips:       ["completed", "in progress", "cash", "today"],
  },
  admin: {
    label:       "Central Admin Spotlight",
    placeholder: "Search provider names, approvals, tickets...",
    endpoint:    "/search",
    chips:       ["pending", "approved", "today", "cash"],
  },
  public: {
    label:       "EliteCrew Service Search",
    placeholder: "Search home services (AC, cooler, wiring)...",
    endpoint:    "/search/public",
    chips:       ["AC repair", "Fridge repair", "Fan install", "TV mounting"],
  },
};

// ─── Result type icon map ──────────────────────────────────────────────────────

const TYPE_ICON = {
  service:          Wrench,
  booking:          BriefcaseBusiness,
  provider:         ShieldCheck,
  provider_service: ClipboardCheck,
  customer:         UserRound,
  admin:            UserRound,
  user:             UserRound,
  payment:          CreditCard,
  action:           ArrowRight,
};

const TYPE_COLORS = {
  service:          "bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
  booking:          "bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
  provider:         "bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
  provider_service: "bg-teal-50 text-teal-600 border border-teal-100/50 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/40",
  customer:         "bg-purple-50 text-purple-600 border border-purple-100/50 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40",
  admin:            "bg-rose-50 text-rose-600 border border-rose-100/50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40",
  user:             "bg-indigo-50 text-indigo-600 border border-indigo-100/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40",
  payment:          "bg-pink-50 text-pink-600 border border-pink-100/50 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/40",
  action:           "bg-cyan-50 text-cyan-600 border border-cyan-100/50 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/40",
};

// ─── Recent search history (localStorage) ─────────────────────────────────────

const HISTORY_KEY = "sm_recent_searches";
const MAX_HISTORY = 5;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
function pushHistory(q) {
  if (!q || q.length < 2) return;
  const next = [q, ...loadHistory().filter(h => h !== q)].slice(0, MAX_HISTORY);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
}
function wipeHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

// Helper to escape regex values
function escapeRegex(v = "") {
  return String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// High-fidelity keyword matcher that wraps characters dynamically
function highlightMatch(text, query, isActive) {
  if (!query || !text) return <span>{text}</span>;
  
  const escaped = escapeRegex(query);
  const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));
  
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className={`font-black rounded px-0.5 transition-colors ${
              isActive
                ? "bg-amber-400 text-zinc-950 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                : "bg-indigo-100 text-indigo-700 font-bold"
            }`}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// Converts "provider_service" → "Provider Service"
function formatType(type = "") {
  return type
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SmartSearch({ role: roleProp, compact = false, className = "" }) {
  const router   = useRouter();
  const boxRef   = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [hasError,  setHasError]  = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [history,   setHistory]   = useState([]);

  const role = useMemo(
    () => roleProp || getStoredUser()?.role || "public",
    [roleProp],
  );
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.public;

  // Load history from localStorage once on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Abort in-flight request on component unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Keyboard shortcut (⌘K or Ctrl+K) to focus input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  // Debounced search with AbortController
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      abortRef.current?.abort();
      abortRef.current = null;
      setResults([]);
      setLoading(false);
      setHasError(false);
      return;
    }

    let stale = false;

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller   = new AbortController();
      abortRef.current   = controller;

      setLoading(true);
      setHasError(false);

      try {
        const { data } = await api.get(cfg.endpoint, {
          params: { q: trimmed },
          signal: controller.signal,
        });

        if (!stale) {
          setResults(data.results || []);
          setActiveIdx(-1);
        }
      } catch (err) {
        if (stale) return;
        if (
          err.name     === "CanceledError" ||
          err.name     === "AbortError"    ||
          err.code     === "ERR_CANCELED"
        ) return;

        setResults([]);
        setHasError(true);
      } finally {
        if (!stale) setLoading(false);
      }
    }, 220);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query, cfg.endpoint]);

  // Combined Results (Backend API + Client Predefined Fuzzy Matching)
  const mergedResults = useMemo(() => {
    if (query.trim().length < 2) return [];

    const seen = new Set();
    const output = [];

    // 1. Backend results (highest priority)
    results.forEach(item => {
      const key = `${item.type}:${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        output.push(item);
      }
    });

    // 2. Local fallback matches
    const locals = searchLocal(query, role);
    locals.forEach(item => {
      const key = `${item.type}:${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        output.push(item);
      }
    });

    return output.slice(0, 10);
  }, [results, query, role]);

  // Choose a result
  const choose = useCallback((item) => {
    pushHistory(query.trim());
    setHistory(loadHistory());
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIdx(-1);
    if (item?.href) router.push(item.href);
  }, [query, router]);

  // Keyboard navigation
  const onKeyDown = useCallback((e) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, mergedResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && mergedResults[activeIdx]) {
        choose(mergedResults[activeIdx]);
      } else if (query.trim().length >= 2) {
        pushHistory(query.trim());
        setHistory(loadHistory());
        if (mergedResults[0]) {
          choose(mergedResults[0]);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }, [open, mergedResults, activeIdx, query, choose]);

  // Chip / history click
  const applyChip = (text) => {
    setQuery(text);
    setOpen(true);
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const onClearHistory = (e) => {
    e.stopPropagation();
    wipeHistory();
    setHistory([]);
  };

  const onRemoveHistoryItem = (e, text) => {
    e.stopPropagation();
    const next = history.filter(h => h !== text);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
  };

  // Display flags
  const hasQuery    = query.trim().length >= 2;
  const showChips   = !hasQuery && cfg.chips.length > 0;
  const showHistory = !hasQuery && history.length > 0;

  return (
    <div
      ref={boxRef}
      className={`relative z-50 transition-all duration-200 ${
        compact ? "w-full max-w-xs" : "w-full max-w-3xl"
      } ${className}`}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
    >
      {/* ── Spotlight dim backdrop blur overlay ── */}
      {open && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[3px] transition-opacity duration-300 z-40 cursor-default"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Search Input Frame ── */}
      <div className="relative z-50">
        {compact ? (
          <div className="relative flex items-center h-10 w-full rounded-xl border border-zinc-200/90 bg-zinc-50/80 hover:bg-zinc-100/60 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all duration-250 px-3.5 gap-2.5">
            <Search size={15} className="text-zinc-400 shrink-0" strokeWidth={2.4} />
            <input
              ref={inputRef}
              role="searchbox"
              aria-label={cfg.label}
              aria-autocomplete="list"
              aria-controls="sm-results"
              aria-activedescendant={activeIdx >= 0 ? `sm-result-${activeIdx}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActiveIdx(-1);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={cfg.placeholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent text-xs font-bold text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setHasError(false);
                  setActiveIdx(-1);
                  inputRef.current?.focus();
                }}
                className="text-zinc-400 hover:text-zinc-900 transition-colors p-0.5 hover:bg-zinc-200/50 rounded-full"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-200 bg-white px-1.5 font-mono text-[9px] font-medium text-zinc-400 shadow-sm shrink-0">
                ⌘K
              </kbd>
            )}
          </div>
        ) : (
          <div className="relative rounded-full bg-gradient-to-b from-zinc-700 via-zinc-950 to-black p-[2px] shadow-[0_12px_28px_rgba(0,0,0,0.22),inset_0_2px_4px_rgba(255,255,255,0.18)]">
            <div className="relative rounded-full bg-white shadow-[inset_0_2px_5px_rgba(0,0,0,0.16)] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-300">
              
              {/* Search icon button */}
              <div className="absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950 text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:h-11 md:w-11">
                <Search size={20} strokeWidth={2.8} />
              </div>

              <input
                ref={inputRef}
                role="searchbox"
                aria-label={cfg.label}
                aria-autocomplete="list"
                aria-controls="sm-results"
                aria-activedescendant={activeIdx >= 0 ? `sm-result-${activeIdx}` : undefined}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setActiveIdx(-1);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder={cfg.placeholder}
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full rounded-full bg-transparent pl-14 pr-14 text-sm font-black text-zinc-900 outline-none placeholder:text-zinc-400 md:h-14 md:pl-16 md:pr-16 md:text-base"
              />

              {/* Clear (×) or cursor icon on the right */}
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setHasError(false);
                    setActiveIdx(-1);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <X size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Open search"
                  onClick={() => { setOpen(true); inputRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-18deg] text-zinc-500 drop-shadow-[0_4px_2px_rgba(0,0,0,0.25)] hover:text-indigo-600 transition-colors"
                >
                  <MousePointer2 size={26} fill="currentColor" strokeWidth={1.8} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          id="sm-results"
          role="listbox"
          className={`absolute top-full z-50 mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white/99 backdrop-blur-2xl shadow-[0_25px_65px_-15px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-top-3 duration-200 ${
            compact 
              ? "right-0 w-[92vw] sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] md:w-[500px] origin-top-right sm:origin-top" 
              : "left-0 right-0 origin-top"
          }`}
        >
          {/* Header */}
          <div className="border-b border-zinc-100 px-5 py-4 bg-zinc-50/50">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                  {cfg.label}
                </p>
              </span>
              {hasQuery && !loading && !hasError && mergedResults.length > 0 && (
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-200/50 px-2 py-0.5 rounded-full">
                  {mergedResults.length} suggestion{mergedResults.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Quick-access chips (shown when query is empty) */}
            {showChips && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cfg.chips.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => applyChip(chip)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-sm transition-all duration-200"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Body */}
          <div className="max-h-[26rem] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">

            {/* ── Skeleton rows while loading ── */}
            {loading && (
              <div className="p-3 space-y-1">
                {[80, 60, 75].map((w, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3 border border-transparent">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div
                        className="h-3 bg-zinc-150 animate-pulse rounded-full"
                        style={{ width: `${w}%` }}
                      />
                      <div
                        className="h-2.5 bg-zinc-100 animate-pulse rounded-full"
                        style={{ width: `${w - 20}%` }}
                      />
                    </div>
                    <div className="w-14 h-4 bg-zinc-100 animate-pulse rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* ── API error state ── */}
            {!loading && hasError && (
              <div className="px-5 py-12 text-center">
                <AlertCircle size={28} className="text-rose-500 mx-auto mb-3 animate-bounce" />
                <p className="text-sm font-black text-zinc-900 mb-1">Spotlight Connection Error</p>
                <p className="text-xs font-semibold text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                  Could not securely connect to EliteCrew. Please verify your connection and try again.
                </p>
              </div>
            )}

            {/* ── No results ── */}
            {!loading && !hasError && hasQuery && mergedResults.length === 0 && (
              <div className="px-5 py-12 text-center">
                <Sparkles size={28} className="text-amber-500 mx-auto mb-3 rotate-12" />
                <p className="text-sm font-black text-zinc-900 mb-1">
                  No matching services for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs font-semibold text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                  Search for tags like &ldquo;AC&rdquo;, &ldquo;fridge&rdquo;, &ldquo;wiring&rdquo;, or booking keywords like &ldquo;completed&rdquo; / &ldquo;today&rdquo;.
                </p>
              </div>
            )}

            {/* ── Empty Query State: Custom Dashboard Grids & History ── */}
            {!loading && !hasError && !hasQuery && (
              <div className="divide-y divide-zinc-100">
                {/* 1. Recent Searches */}
                {showHistory && (
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        <History size={11} className="text-zinc-400" /> Recent Queries
                      </p>
                      <button
                        type="button"
                        onClick={onClearHistory}
                        className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-500 transition-colors bg-zinc-100 px-2.5 py-0.5 rounded-full"
                      >
                        Wipe All
                      </button>
                    </div>
                    <div className="space-y-1">
                      {history.map(h => (
                        <div
                          key={h}
                          onClick={() => applyChip(h)}
                          className="w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-400 group-hover:text-zinc-700 transition-colors">
                              <History size={12} />
                            </span>
                            <span className="text-xs font-bold text-zinc-700 truncate">{h}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => onRemoveHistoryItem(e, h)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-800 p-1 hover:bg-zinc-200/60 rounded-full transition-all shrink-0"
                            aria-label="Remove item"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Role-Specific Grid Panels */}
                <div className="px-5 py-5">
                  <div className="flex items-center gap-1.5 mb-3.5">
                    <LayoutDashboard size={12} className="text-zinc-400" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      Quick Access Dashboard
                    </p>
                  </div>

                  {/* Public / Customer Grid */}
                  {(role === "public" || role === "customer") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => applyChip("AC Service")}
                        className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-cyan-50/20 hover:bg-cyan-50/50 hover:border-cyan-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100/70 text-cyan-600 group-hover:scale-105 transition-transform shrink-0">
                          <Snowflake size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-black text-zinc-800 truncate">AC Gas & Jet Clean</span>
                            <span className="bg-cyan-100 text-cyan-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 shrink-0">Cooling</span>
                          </div>
                          <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">High-pressure deep clean starts ₹399</span>
                        </div>
                      </div>

                      <div
                        onClick={() => applyChip("Electrical wiring")}
                        className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-amber-50/30 hover:bg-amber-50/60 hover:border-amber-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/60 text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                          <Zap size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-black text-zinc-800 truncate">Electrical Repairs</span>
                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 shrink-0">Hot</span>
                          </div>
                          <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Certified electricians starts ₹199</span>
                        </div>
                      </div>

                      <div
                        onClick={() => applyChip("Refrigerator Repair")}
                        className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-blue-50/20 hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/70 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                          <Refrigerator size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-black text-zinc-800 truncate">Fridge Specialists</span>
                            <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 shrink-0">Expert</span>
                          </div>
                          <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Compressor repairs & diagnostics starts ₹499</span>
                        </div>
                      </div>

                      <div
                        onClick={() => applyChip("Fan Installation")}
                        className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-emerald-50/20 hover:bg-emerald-50/50 hover:border-emerald-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                          <Fan size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-black text-zinc-800 truncate">Ceiling Fan Installation</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 shrink-0">Fast</span>
                          </div>
                          <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">High-speed fan mount & wiring starts ₹149</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Provider Grid */}
                  {role === "provider" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link href="/dashboard/provider/orders">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-emerald-50/20 hover:bg-emerald-50/50 hover:border-emerald-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-600 shrink-0">
                            <BriefcaseBusiness size={18} />
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">My Active Orders</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Assigned jobs, directions, and timings</span>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dashboard/provider/completed">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-amber-50/20 hover:bg-amber-50/50 hover:border-amber-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/70 text-amber-600 shrink-0">
                            <DollarSign size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">Weekly Earnings Log</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Track completed payouts & performance charts</span>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dashboard/provider/profile">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-indigo-50/20 hover:bg-indigo-50/50 hover:border-indigo-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600 shrink-0">
                            <Wrench size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">Manage My Skills & Rates</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Add offered services, pricing thresholds</span>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dashboard/provider/profile">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-rose-50/20 hover:bg-rose-50/50 hover:border-rose-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100/70 text-rose-600 shrink-0">
                            <Star size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">Customer Rating Analytics</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Review feedback rating comments from orders</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Admin Grid */}
                  {role === "admin" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      <Link href="/admin/providers">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-emerald-50/20 hover:bg-emerald-50/50 hover:border-emerald-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-600 shrink-0">
                            <ShieldCheck size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">Provider Administration</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Search, monitor, audit or disable provider profiles</span>
                          </div>
                        </div>
                      </Link>

                      <Link href="/admin/approved">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-amber-50/20 hover:bg-amber-50/50 hover:border-amber-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/70 text-amber-600 shrink-0">
                            <UserCheck size={18} />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">Pending KYC Approvals</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Activate pending onboardings and registrations</span>
                          </div>
                        </div>
                      </Link>

                      <Link href="/admin/coupons">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-blue-50/20 hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/70 text-blue-600 shrink-0">
                            <Percent size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">Discount Coupons & Offers</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Create custom discounts and promo campaigns</span>
                          </div>
                        </div>
                      </Link>

                      <Link href="/admin/support">
                        <div className="flex items-center gap-3.5 rounded-xl border border-zinc-100 p-3 bg-rose-50/20 hover:bg-rose-50/50 hover:border-rose-200 cursor-pointer group transition-all duration-200 hover:translate-x-0.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100/70 text-rose-600 shrink-0">
                            <ShieldAlert size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-zinc-800 block truncate">Helpdesk & Support Center</span>
                            <span className="text-[10px] font-medium text-zinc-400 block line-clamp-1 mt-0.5">Resolve active complaints and refund disputes</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Admin Smart Filters */}
                  {role === "admin" && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Filter size={10} className="text-zinc-400" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Smart CRM Filters</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["status:pending", "role:provider", "city:Mumbai", "completed today", "payouts"].map(pill => (
                          <button
                            key={pill}
                            type="button"
                            onClick={() => applyChip(pill)}
                            className="bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 border border-zinc-200 hover:border-indigo-300 text-zinc-600 font-extrabold text-[9px] px-2.5 py-1 rounded-full transition-all"
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Combined Results List ── */}
            {!loading && !hasError && mergedResults.map((item, idx) => {
              const Icon     = TYPE_ICON[item.type] || Search;
              const isActive = idx === activeIdx;
              const colorClass = TYPE_COLORS[item.type] || "bg-zinc-50 text-zinc-500 border border-zinc-200/50";

              const inner = (
                <div
                  id={`sm-result-${idx}`}
                  role="option"
                  aria-selected={isActive}
                  className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-all duration-200 border border-transparent ${
                    isActive
                      ? "bg-zinc-950 text-white translate-x-1 shadow-md"
                      : "hover:bg-zinc-50 hover:translate-x-0.5 text-zinc-900"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? "bg-white/15 text-white border border-white/20 rotate-6"
                      : colorClass
                  }`}>
                    <Icon size={16} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black tracking-tight leading-tight">
                      {highlightMatch(item.label, query, isActive)}
                    </span>
                    {item.meta && (
                      <span className={`mt-1 block truncate text-xs font-semibold ${
                        isActive ? "text-white/60" : "text-zinc-400"
                      }`}>
                        {highlightMatch(item.meta, query, isActive)}
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                      isActive ? "bg-white/15 text-white/80" : "bg-zinc-150 text-zinc-500"
                    }`}>
                      {formatType(item.type)}
                    </span>
                    <ChevronRight size={13} className={`transition-transform duration-200 ${
                      isActive ? "text-white translate-x-0.5" : "text-zinc-300"
                    }`} />
                  </div>
                </div>
              );

              return item.href ? (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={() => choose(item)}
                  className="block p-1"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={`${item.type}-${item.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => choose(item)}
                  onKeyDown={e => e.key === "Enter" && choose(item)}
                  className="block p-1 outline-none"
                >
                  {inner}
                </div>
              );
            })}
          </div>

          {/* ── Footer controls ── */}
          {hasQuery && !loading && mergedResults.length > 0 && (
            <div className="border-t border-zinc-100 px-5 py-2.5 flex items-center bg-zinc-50/50">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-400 flex items-center gap-1">
                <kbd className="bg-white border border-zinc-200 px-1 rounded shadow-sm text-[8px]">↑↓</kbd> navigate · 
                <kbd className="bg-white border border-zinc-200 px-1 rounded shadow-sm text-[8px]">Enter</kbd> select · 
                <kbd className="bg-white border border-zinc-200 px-1 rounded shadow-sm text-[8px]">Esc</kbd> dismiss
              </span>
              {activeIdx >= 0 && (
                <span className="ml-auto text-[9px] font-black uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(99,102,241,0.3)]">
                  {activeIdx + 1} of {mergedResults.length}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
