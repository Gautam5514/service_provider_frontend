"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, performLogout, validateSession, saveAuthSession, clearAuthSession } from "@/lib/auth";
import { CATEGORY_META, SERVICE_CATALOG, formatPrice } from "@/lib/services";
import LocationBar from "@/components/LocationBar";
import SmartSearch from "@/components/SmartSearch";
import NotificationBell from "@/components/NotificationBell";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Fan,
  MapPin,
  Monitor,
  Plug,
  Quote,
  Refrigerator,
  Repeat2,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wind,
  Wrench,
  Zap,
  X,
  Info,
  ChevronDown,
  ShieldAlert,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";

// ─── Static data ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    Icon: Search,
    title: "Pick a service",
    desc: "Browse our catalog or search — AC repair, wiring, fridge, fan. Everything's listed with upfront pricing.",
  },
  {
    Icon: CalendarCheck,
    title: "Choose a slot",
    desc: "Pick a date and time that works for you. We confirm instantly and send email reminders.",
  },
  {
    Icon: BadgeCheck,
    title: "Job done, then pay",
    desc: "A verified professional arrives, completes the work. You only pay after you're satisfied.",
  },
];

const TRUST = [
  {
    Icon:  ShieldCheck,
    label: "KYC Verified",
    desc:  "Every professional passes Aadhaar, PAN and background verification before joining.",
    tint:  "bg-emerald-50 border-emerald-200 text-emerald-600",
  },
  {
    Icon:  Star,
    label: "Top Rated Only",
    desc:  "We maintain a strict 4.2-star floor. Below that, providers are removed.",
    tint:  "bg-amber-50 border-amber-200 text-amber-600",
  },
  {
    Icon:  CreditCard,
    label: "Pay After Service",
    desc:  "Cash or UPI — after the job is done. Zero advance payment, zero risk.",
    tint:  "bg-sky-50 border-sky-200 text-sky-600",
  },
  {
    Icon:  Repeat2,
    label: "Re-book Instantly",
    desc:  "Loved your pro? One-tap re-booking from your order history.",
    tint:  "bg-violet-50 border-violet-200 text-violet-600",
  },
];

const INITIAL_TESTIMONIALS = [
  {
    name:    "Priya Sharma",
    city:    "Mumbai",
    rating:  5,
    avatar:  "PS",
    category: "ac",
    service: "AC Repair",
    text:    "Booked at 10 PM, technician was at my door by 9 AM. Fixed in under an hour. Pricing was exactly as shown — no hidden charges.",
  },
  {
    name:    "Rahul Verma",
    city:    "Bangalore",
    rating:  5,
    avatar:  "RV",
    category: "electrical",
    service: "Electrical Work",
    text:    "Had an electrical fault for weeks. The ServiceMarket technician diagnosed and fixed it in 30 minutes. Clean work, zero mess.",
  },
  {
    name:    "Anjali Mehra",
    city:    "Delhi",
    rating:  4,
    avatar:  "AM",
    category: "ac",
    service: "AC Deep Cleaning",
    text:    "AC deep cleaning was incredibly thorough. Punctual, courteous, and my unit runs like new. Already re-booked for next season.",
  },
  {
    name:    "Vikram Goel",
    city:    "Hyderabad",
    rating:  5,
    avatar:  "VG",
    category: "fridge",
    service: "Fridge Repair",
    text:    "Our double-door fridge stopped cooling suddenly. The technician replaced the defrost heater quickly. Exceptional knowledge and service.",
  },
  {
    name:    "Sandhya R.",
    city:    "Chennai",
    rating:  4,
    avatar:  "SR",
    category: "appliance",
    service: "Washing Machine",
    text:    "Very professional washing machine service. Explained the drum issue clearly and fixed it inside an hour. Recommended!",
  },
];

const CITIES = [
  "Mumbai","Delhi","Bangalore","Hyderabad","Chennai",
  "Pune","Kolkata","Ahmedabad","Jaipur","Lucknow","Noida","Gurgaon",
];

const CITY_LANDMARKS = {
  Mumbai:    { label: "Mumbai",    state: "Maharashtra",   gradient: "bg-blue-950",    images: [{ landmark: "Gateway of India",   wiki: "Gateway_of_India"                   }, { landmark: "Marine Drive",        wiki: "Marine_Drive,_Mumbai"                }] },
  Delhi:     { label: "New Delhi", state: "Delhi",         gradient: "bg-zinc-900",    images: [{ landmark: "India Gate",          wiki: "India_Gate"                         }, { landmark: "Red Fort",            wiki: "Red_Fort"                            }] },
  Bangalore: { label: "Bengaluru", state: "Karnataka",     gradient: "bg-emerald-950", images: [{ landmark: "Vidhana Soudha",     wiki: "Vidhana_Soudha"                     }, { landmark: "Lalbagh Gardens",     wiki: "Lalbagh_Botanical_Garden"            }] },
  Hyderabad: { label: "Hyderabad", state: "Telangana",     gradient: "bg-amber-950",   images: [{ landmark: "Charminar",           wiki: "Charminar"                          }, { landmark: "Golconda Fort",       wiki: "Golconda_Fort"                       }] },
  Chennai:   { label: "Chennai",   state: "Tamil Nadu",    gradient: "bg-orange-950",  images: [{ landmark: "Marina Beach",        wiki: "Marina_Beach"                       }, { landmark: "Kapaleeshwarar",      wiki: "Kapaleeshwarar_temple"               }] },
  Pune:      { label: "Pune",      state: "Maharashtra",   gradient: "bg-slate-900",   images: [{ landmark: "Shaniwar Wada",       wiki: "Shaniwar_Wada"                      }, { landmark: "Aga Khan Palace",     wiki: "Aga_Khan_Palace"                     }] },
  Kolkata:   { label: "Kolkata",   state: "West Bengal",   gradient: "bg-indigo-950",  images: [{ landmark: "Victoria Memorial",   wiki: "Victoria_Memorial,_Kolkata"         }, { landmark: "Howrah Bridge",       wiki: "Howrah_Bridge"                       }] },
  Ahmedabad: { label: "Ahmedabad", state: "Gujarat",       gradient: "bg-yellow-950",  images: [{ landmark: "Adalaj Stepwell",     wiki: "Adalaj"                             }, { landmark: "Sabarmati Ashram",    wiki: "Sabarmati_Ashram"                    }] },
  Jaipur:    { label: "Jaipur",    state: "Rajasthan",     gradient: "bg-rose-950",    images: [{ landmark: "Hawa Mahal",           wiki: "Hawa_Mahal"                         }, { landmark: "Amber Fort",          wiki: "Amer_Fort"                           }] },
  Lucknow:   { label: "Lucknow",   state: "Uttar Pradesh", gradient: "bg-teal-950",    images: [{ landmark: "Bara Imambara",        wiki: "Bara_Imambara"                      }, { landmark: "Rumi Darwaza",        wiki: "Rumi_Darwaza"                        }] },
  Noida:     { label: "Noida",     state: "Uttar Pradesh", gradient: "bg-violet-950",  images: [{ landmark: "Akshardham Temple",    wiki: "Swaminarayan_Akshardham_(Delhi)"    }, { landmark: "Okhla Bird Sanctuary",wiki: "Okhla_Bird_Sanctuary"                }] },
  Gurgaon:   { label: "Gurugram",  state: "Haryana",       gradient: "bg-fuchsia-950", images: [{ landmark: "Kingdom of Dreams",    wiki: "Kingdom_of_Dreams"                  }, { landmark: "Sultanpur Lake",      wiki: "Sultanpur_National_Park"             }] },
};

const DEFAULT_GRID_CITIES = ["Delhi", "Mumbai", "Bangalore", "Hyderabad"];

const PROVIDER_PERKS = [
  { Icon: TrendingUp, text: "Earn ₹800–₹2,500 per job"        },
  { Icon: Users,      text: "Steady inbound customer flow"     },
  { Icon: Briefcase,  text: "Work your own hours & days"       },
  { Icon: ShieldCheck,text: "Platform backs every booking"     },
];

const EARNINGS = [
  { role: "AC Technician",       rate: "18–22 jobs / mo", earn: "₹18K–₹25K" },
  { role: "Electrician",         rate: "20–28 jobs / mo", earn: "₹15K–₹22K" },
  { role: "Appliance Repair Pro",rate: "15–20 jobs / mo", earn: "₹12K–₹18K" },
];

const CATEGORY_ICONS = {
  ac:        Snowflake,
  cooler:    Wind,
  fan:       Fan,
  tv:        Monitor,
  fridge:    Refrigerator,
  electrical:Zap,
  appliance: Plug,
};

const SERVICE_IMAGES = {
  "ac-repair": "/images/ac_repair.png",
  "ac-installation": "/images/ac_installation.png",
  "cooler-repair": "/images/cooler_repair.png",
  "fan-repair": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
  "tv-repair": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80",
  "fridge-repair": "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80",
  "electrical-work": "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80",
  "appliance-repair": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
};

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80";

const CATEGORY_BACKGROUNDS = {
  ac:         "/images/ac_repair.png",
  cooler:     "/images/cooler_repair.png",
  fan:        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=300&q=80",
  tv:         "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80",
  fridge:     "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=300&q=80",
  electrical: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=300&q=80",
  appliance:  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80",
};

const CAT_STYLES = {
  ac: {
    accentColor: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    hoverBorder: "group-hover:border-sky-400/40",
    glowColor: "shadow-[0_0_20px_rgba(56,189,248,0.15)]",
    hoverGlow: "group-hover:shadow-[0_20px_40px_-10px_rgba(56,189,248,0.4)]",
    pulseBg: "bg-sky-500",
    gradient: "from-sky-500/20 to-transparent",
    iconBg: "bg-sky-950/40 text-sky-400 group-hover:bg-sky-400 group-hover:text-black",
    iconBorder: "border-sky-500/20 group-hover:border-sky-400",
    dotColor: "bg-sky-500",
    textHover: "group-hover:text-sky-400",
  },
  cooler: {
    accentColor: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    hoverBorder: "group-hover:border-teal-400/40",
    glowColor: "shadow-[0_0_20px_rgba(20,184,166,0.15)]",
    hoverGlow: "group-hover:shadow-[0_20px_40px_-10px_rgba(20,184,166,0.4)]",
    pulseBg: "bg-teal-500",
    gradient: "from-teal-500/20 to-transparent",
    iconBg: "bg-teal-950/40 text-teal-400 group-hover:bg-teal-400 group-hover:text-black",
    iconBorder: "border-teal-500/20 group-hover:border-teal-400",
    dotColor: "bg-teal-500",
    textHover: "group-hover:text-teal-400",
  },
  fan: {
    accentColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    hoverBorder: "group-hover:border-violet-400/40",
    glowColor: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    hoverGlow: "group-hover:shadow-[0_20px_40px_-10px_rgba(139,92,246,0.4)]",
    pulseBg: "bg-violet-500",
    gradient: "from-violet-500/20 to-transparent",
    iconBg: "bg-violet-950/40 text-violet-400 group-hover:bg-violet-400 group-hover:text-black",
    iconBorder: "border-violet-500/20 group-hover:border-violet-400",
    dotColor: "bg-violet-500",
    textHover: "group-hover:text-violet-400",
  },
  tv: {
    accentColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    hoverBorder: "group-hover:border-indigo-400/40",
    glowColor: "shadow-[0_0_20px_rgba(99,102,241,0.15)]",
    hoverGlow: "group-hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)]",
    pulseBg: "bg-indigo-500",
    gradient: "from-indigo-500/20 to-transparent",
    iconBg: "bg-indigo-950/40 text-indigo-400 group-hover:bg-indigo-400 group-hover:text-black",
    iconBorder: "border-indigo-500/20 group-hover:border-indigo-400",
    dotColor: "bg-indigo-500",
    textHover: "group-hover:text-indigo-400",
  },
  fridge: {
    accentColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    hoverBorder: "group-hover:border-cyan-400/40",
    glowColor: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    hoverGlow: "group-hover:shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)]",
    pulseBg: "bg-cyan-500",
    gradient: "from-cyan-500/20 to-transparent",
    iconBg: "bg-cyan-950/40 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black",
    iconBorder: "border-cyan-500/20 group-hover:border-cyan-400",
    dotColor: "bg-cyan-500",
    textHover: "group-hover:text-cyan-400",
  },
  electrical: {
    accentColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    hoverBorder: "group-hover:border-amber-400/40",
    glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    hoverGlow: "group-hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.4)]",
    pulseBg: "bg-amber-500",
    gradient: "from-amber-500/20 to-transparent",
    iconBg: "bg-amber-950/40 text-amber-400 group-hover:bg-amber-400 group-hover:text-black",
    iconBorder: "border-amber-500/20 group-hover:border-amber-400",
    dotColor: "bg-amber-500",
    textHover: "group-hover:text-amber-400",
  },
  appliance: {
    accentColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    hoverBorder: "group-hover:border-rose-400/40",
    glowColor: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    hoverGlow: "group-hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.4)]",
    pulseBg: "bg-rose-500",
    gradient: "from-rose-500/20 to-transparent",
    iconBg: "bg-rose-950/40 text-rose-400 group-hover:bg-rose-400 group-hover:text-black",
    iconBorder: "border-rose-500/20 group-hover:border-rose-400",
    dotColor: "bg-rose-500",
    textHover: "group-hover:text-rose-400",
  },
};

// ─── Diagnostics Tool Mock Data ──────────────────────────────────────────

const DIAGNOSTICS_DATA = {
  ac: {
    name: "Air Conditioner",
    pulseColor: "bg-sky-400 border-sky-200",
    symptoms: [
      {
        id: "ac-s1",
        issue: "AC is blowing room-temperature or warm air",
        cause: "Usually caused by a low refrigerant level or coil leakage. Requires testing and refilling.",
        recommended: "AC Gas Refilling",
        slug: "ac-gas-refilling",
        price: 1299,
        hotspot: { x: "75%", y: "45%" },
      },
      {
        id: "ac-s2",
        issue: "Water is dripping from the indoor unit wall",
        cause: "Clogged condensate drain tube or severe ice accumulation on filters. Jet cleaning flushes it out.",
        recommended: "AC Deep Cleaning",
        slug: "ac-deep-cleaning",
        price: 799,
        hotspot: { x: "25%", y: "60%" },
      },
      {
        id: "ac-s3",
        issue: "Loud humming, clicking, or rattling noise",
        cause: "Loose blower fan blades or failing fan motor assembly. Requires expert diagnostic adjustment.",
        recommended: "AC Repair",
        slug: "ac-repair",
        price: 499,
        hotspot: { x: "50%", y: "30%" },
      },
    ],
  },
  fridge: {
    name: "Refrigerator",
    pulseColor: "bg-cyan-400 border-cyan-200",
    symptoms: [
      {
        id: "fridge-s1",
        issue: "Freezer works fine but fresh food section is warm",
        cause: "Clogged ice duct damper, faulty defrost heating element, or failing air circulation fan.",
        recommended: "Fridge Repair",
        slug: "fridge-repair",
        price: 499,
        hotspot: { x: "50%", y: "20%" },
      },
      {
        id: "fridge-s2",
        issue: "Fridge is totally dead or not cooling at all",
        cause: "Leaking compressor gas line or electrical starter relay failure. Needs technical repair.",
        recommended: "Fridge Gas Refill",
        slug: "fridge-gas-refill",
        price: 1199,
        hotspot: { x: "50%", y: "75%" },
      },
    ],
  },
  electrical: {
    name: "Electrical Systems",
    pulseColor: "bg-amber-400 border-amber-200",
    symptoms: [
      {
        id: "elec-s1",
        issue: "MCB switches trip frequently or sparks inside socket",
        cause: "Defective wiring contact, short circuit loop, or overloaded switchboard breakers.",
        recommended: "Electrical Work",
        slug: "electrical-work",
        price: 299,
        hotspot: { x: "35%", y: "35%" },
      },
      {
        id: "elec-s2",
        issue: "Need heavy duty plug points for dynamic high load",
        cause: "Requires dynamic, robust copper electrical cabling directly routed from mains line panel.",
        recommended: "Wiring & Cabling",
        slug: "wiring-cabling",
        price: 499,
        hotspot: { x: "65%", y: "60%" },
      },
    ],
  },
};

// ─── Small reusable atoms ──────────────────────────────────────────────────────

function Stars({ n = 5, size = 10 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[0,1,2,3,4].map(i => (
        <Star key={i} size={size} strokeWidth={0}
          className={i < n ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"} />
      ))}
    </span>
  );
}

function Overline({ children, light = false }) {
  return (
    <p className={`text-[10px] font-bold tracking-[0.28em] uppercase mb-3 flex items-center gap-2 ${light ? "text-white/30" : "text-zinc-400"}`}>
      <span className="w-5 h-px bg-current opacity-60 shrink-0" />
      {children}
    </p>
  );
}

// ─── Wikipedia image cache (module-level — survives re-renders) ────────────────
const _wikiCache = {};

async function fetchWikiImg(articleTitle) {
  if (_wikiCache[articleTitle] !== undefined) return _wikiCache[articleTitle];

  try {
    const res  = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();

    const thumb = data.thumbnail?.source
      ? data.thumbnail.source.replace(/\/\d+px-/, "/800px-")
      : null;
    const url = thumb || data.originalimage?.source || null;

    _wikiCache[articleTitle] = url;
    return url;
  } catch {
    _wikiCache[articleTitle] = null;
    return null;
  }
}

// ─── CityImage ─────────────────────────────────────────────────────────────────
function CityImage({ wiki, landmark, cityLabel, gradient }) {
  const [fetchResult, setFetchResult] = useState(null);

  useEffect(() => {
    if (!wiki) return;

    let cancelled = false;

    fetchWikiImg(wiki).then(url => {
      if (!cancelled) setFetchResult(url || false);
    });

    return () => {
      cancelled = true;
      setFetchResult(null);
    };
  }, [wiki]);

  const isLoading = !!wiki && fetchResult === null;
  const ready     = typeof fetchResult === "string" && fetchResult.length > 0;
  const failed    = !wiki || fetchResult === false;
  const imgUrl    = ready ? fetchResult : null;

  return (
    <div className={`relative w-full h-full overflow-hidden ${ready ? "bg-zinc-900" : (gradient || "bg-zinc-900")}`}>

      {isLoading && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
      )}

      {failed && (
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "8px 8px" }} />
      )}

      {ready && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imgUrl}
          alt={`${landmark} — ${cityLabel}`}
          onError={() => setFetchResult(false)}
          className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 hover:scale-105"
        />
      )}

      {ready && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-white px-4 py-3">
        <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-zinc-400 mb-0.5">
          Featured City
        </p>
        <p className="text-[13px] font-extrabold text-black tracking-tight leading-tight">{cityLabel}</p>
        <p className="text-[10px] text-zinc-500 font-medium truncate">{landmark}</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [user,      setUser]      = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [location,  setLocation]  = useState(null);

  useEffect(() => {
    // Validate the httpOnly cookie with the server on every page load.
    // This corrects any localStorage tampering (e.g. manually setting role:"admin")
    // before the UI renders the wrong nav state or redirects.
    let cancelled = false;
    validateSession().then((verified) => {
      if (cancelled) return;
      setUser(verified);
      setAuthReady(true);
      if (verified?.role === "provider") router.replace("/dashboard/provider");
      if (verified?.role === "admin")    router.replace("/admin");
    });
    return () => { cancelled = true; };
  }, [router]);

  const logout = () => { performLogout(); setUser(null); };

  const popularServices = Object.values(SERVICE_CATALOG).flat().filter(s => s.popular).slice(0, 6);
  const catCounts       = Object.fromEntries(
    Object.entries(SERVICE_CATALOG).map(([k, a]) => [k, a.length])
  );

  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch("/api/stats/public")
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d); })
      .catch(() => {});
  }, []);

  const STATS = [
    { value: stats ? `${stats.bookingsDone.toLocaleString("en-IN")}+` : "12,450+", label: "Bookings Done",   Icon: CalendarCheck },
    { value: stats ? `${stats.verifiedProviders.toLocaleString("en-IN")}+` : "2,000+", label: "Verified Pros", Icon: BadgeCheck    },
    { value: "4.8★", label: "Avg. Rating",   Icon: Star   },
    { value: stats ? `${stats.citiesCovered}+` : "25+",     label: "Cities",         Icon: MapPin        },
  ];

  const [citySearch, setCitySearch] = useState("");
  const [pinnedCity, setPinnedCity] = useState("Delhi");

  const searchMatchCity = useMemo(() => {
    const q = citySearch.toLowerCase().trim();
    if (!q) return null;
    const exact = CITIES.find(c => c.toLowerCase() === q);
    if (exact) return exact;
    const prefix = CITIES.filter(c => c.toLowerCase().startsWith(q));
    return prefix.length === 1 ? prefix[0] : null;
  }, [citySearch]);

  const activeCity = searchMatchCity || pinnedCity;

  const filteredCities = useMemo(
    () => !citySearch.trim()
      ? CITIES
      : CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())),
    [citySearch],
  );

  const gridItems = useMemo(() => {
    const city = CITY_LANDMARKS[activeCity];
    if (city) {
      return [
        { kind: "img",  ...city.images[0], cityLabel: city.label, gradient: city.gradient },
        { kind: "img",  ...city.images[1], cityLabel: city.label, gradient: city.gradient },
        { kind: "info" },
        { kind: "book" },
      ];
    }
    return DEFAULT_GRID_CITIES.map(c => ({
      kind:      "img",
      ...CITY_LANDMARKS[c].images[0],
      cityLabel: CITY_LANDMARKS[c].label,
      gradient:  CITY_LANDMARKS[c].gradient,
    }));
  }, [activeCity]);

  // ─── Diagnostics Tab & Hotspot State ───────────────────────────────
  const [diagTab, setDiagTab] = useState("ac");
  // Initialize with the first AC symptom so the panel is never empty on load.
  const [selectedSymptom, setSelectedSymptom] = useState(
    () => DIAGNOSTICS_DATA["ac"]?.symptoms[0] || null
  );

  // Switch tab AND reset the symptom in one event-handler call instead of
  // a useEffect — avoids the synchronous-setState-inside-effect lint error
  // and removes an unnecessary extra render cycle.
  const handleDiagTabChange = (key) => {
    setDiagTab(key);
    setSelectedSymptom(DIAGNOSTICS_DATA[key]?.symptoms[0] || null);
  };

  // ─── Quick View Sheet State ──────────────────────────────────────────
  const [quickViewService, setQuickViewService] = useState(null);

  // ─── Testimonials Hub Dynamic Filters & Rating Submission ──────────
  // Seed with the static fallback immediately so the section is never empty,
  // then replace with live data from the API once it arrives.
  const [testimonials, setTestimonials] = useState(INITIAL_TESTIMONIALS);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(null);

  useEffect(() => {
    fetch("/api/testimonials")
      .then(r => r.json())
      .then(d => { if (d.success && d.testimonials?.length) setTestimonials(d.testimonials); })
      .catch(() => {}); // silently fall back to INITIAL_TESTIMONIALS on error
  }, []);
  
  // Custom Reviews drawer open/close
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Delhi");
  const [formRating, setFormRating] = useState(5);
  const [formCategory, setFormCategory] = useState("ac");
  const [formService, setFormService] = useState("AC Service");
  const [formText, setFormText] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filtered reviews calculations
  const filteredReviews = useMemo(() => {
    return testimonials.filter(review => {
      const matchCat = categoryFilter === "all" || review.category === categoryFilter;
      const matchRating = !ratingFilter || review.rating === ratingFilter;
      return matchCat && matchRating;
    });
  }, [testimonials, categoryFilter, ratingFilter]);

  // Review star counts for distribution chart
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    testimonials.forEach(r => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });
    const total = testimonials.length || 1;
    return Object.fromEntries(
      Object.entries(counts).map(([star, count]) => [star, { count, pct: Math.round((count / total) * 100) }])
    );
  }, [testimonials]);

  const [submitError, setSubmitError] = useState("");

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!formName.trim() || !formText.trim()) return;
    if (formText.trim().length < 20) {
      setSubmitError("Review must be at least 20 characters.");
      return;
    }

    try {
      const res  = await fetch("/api/testimonials", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name: formName, city: formCity, rating: formRating,
          category: formCategory, service: formService, text: formText,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.message || "Could not submit. Please try again.");
        return;
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      return;
    }

    // Show success, then close drawer and reset — the review will appear
    // after admin approval so we do NOT push it into local state.
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsReviewDrawerOpen(false);
      setFormName("");
      setFormText("");
      setFormRating(5);
      setSubmitError("");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white relative">

      {/* ── TOP ANNOUNCEMENT ─────────────────────────────────────────── */}
      <div className="bg-zinc-950 border-b border-zinc-800 py-2 text-center">
        <p className="text-[10px] font-semibold text-white/40 tracking-wide">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle mr-2 animate-pulse" />
          Now live in 25+ cities · Free service diagnosis on every visit · Pay after job done
        </p>
      </div>

      {/* ── NAVBAR ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/96 backdrop-blur-md border-b border-zinc-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-black rounded-xl opacity-0 group-hover:opacity-5 transition-opacity" />
              <img 
                src="/logo-transparent.png" 
                alt="ServiceMarket" 
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
            </div>
            <span className="hidden sm:block text-base font-extrabold tracking-tight">
              Service<span className="font-light text-zinc-400">Market</span>
            </span>
          </Link>

          {/* Desktop search */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <SmartSearch role={user?.role === "customer" ? "customer" : "public"} compact />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {authReady && (
              <>
                <LocationBar onLocationChange={setLocation} compact />
                {user ? (
                  <>
                    <Link href="/bookings"
                      className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors border border-zinc-200 px-3 py-1.5 hover:border-zinc-400">
                      <CalendarDays size={13} /> Bookings
                    </Link>
                    <NotificationBell variant="light" />
                    <button onClick={logout}
                      className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-red-500 transition-colors">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login"
                      className="hidden sm:block text-xs font-semibold text-zinc-500 hover:text-black transition-colors px-1">
                      Sign In
                    </Link>
                    <Link href="/register"
                      className="bg-black text-white px-4 py-2 text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors">
                      Register
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile search row */}
        <div className="md:hidden border-t border-zinc-100 px-4 py-2.5">
          <SmartSearch role={user?.role === "customer" ? "customer" : "public"} compact />
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative bg-zinc-950 text-white overflow-hidden">
        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px)," +
              "linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[400px]"
          style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 md:px-10 pt-14 pb-10 md:pt-20 md:pb-14">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 border border-white/[0.12] bg-white/[0.05] px-3.5 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/50">
              Trusted Home Services
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.04] max-w-4xl mb-5">
            Expert home services,{" "}
            <span className="text-white/30">at your doorstep.</span>
          </h1>

          <p className="text-white/45 text-base md:text-lg max-w-[500px] mb-8 leading-relaxed">
            Book KYC-verified technicians & appliance experts in minutes.
            Transparent pricing — pay only after the job is done.
          </p>

          {/* Location picker */}
          <div className="mb-8">
            <LocationBar onLocationChange={setLocation} />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-14">
            <Link href="/services/ac"
              className="group inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-100 transition-colors">
              Book AC Service
              <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link href="#categories"
              className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-7 py-3.5 text-xs font-bold tracking-widest uppercase hover:border-white/35 hover:text-white hover:bg-white/[0.04] transition-all">
              Browse All Services
            </Link>
            {!user && (
              <Link href="/provider"
                className="hidden sm:block text-white/25 hover:text-white/50 text-[10px] font-bold tracking-widest uppercase transition-colors ml-2">
                Earn as Provider →
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div className="border-t border-white/[0.07] pt-8 grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-6">
            {STATS.map(({ value, label, Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-9 h-9 shrink-0 border border-white/[0.10] bg-white/[0.05] flex items-center justify-center">
                  <Icon size={15} className="text-white/40" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-xl font-extrabold text-white leading-none">{value}</p>
                  <p className="text-[10px] text-white/30 font-semibold tracking-wider uppercase mt-0.5">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES ───────────────────────────────────────── */}
      <section id="categories" className="py-24 md:py-32 relative overflow-hidden bg-white border-b border-zinc-100 animate-reveal-up">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '64px 64px'}} 
        />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-px bg-zinc-950" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">Discover Services</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black mb-6 leading-[0.9]">
                Browse by <span className="text-zinc-300">Category</span>
              </h2>
              {location && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-zinc-50 border border-zinc-150 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-bold text-zinc-500">
                    Showing top-rated professionals in <span className="text-black">{location.city}</span>
                  </p>
                </div>
              )}
            </div>
            <Link href="/services/ac"
              className="group flex items-center gap-3 text-[11px] font-black tracking-widest uppercase text-black">
              View All Services
              <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-300">
                <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-5 lg:gap-6 mb-20">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const Icon  = CATEGORY_ICONS[key] || Sparkles;
              const count = catCounts[key] || 0;
              const bgUrl = CATEGORY_BACKGROUNDS[key];
              const sty   = CAT_STYLES[key] || {};
              return (
                <Link key={key} href={`/services/${key}`} className="group relative">
                  <div className={`h-full min-h-[185px] bg-zinc-950 p-6 flex flex-col items-center justify-center text-center transition-all duration-700 hover:-translate-y-2 cursor-pointer rounded-2xl smooth-lift relative overflow-hidden border border-zinc-900/60 ${sty.hoverBorder || 'hover:border-zinc-700'} ${sty.hoverGlow || ''}`}>
                    
                    {bgUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={bgUrl}
                        alt={meta.label}
                        className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale contrast-125 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-40 group-hover:grayscale-0 pointer-events-none"
                      />
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/60 to-zinc-950/95 pointer-events-none transition-all duration-700 group-hover:from-zinc-950/10 group-hover:via-zinc-950/50 group-hover:to-zinc-950/90" />
                    
                    <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none group-hover:border-white/10 transition-all duration-500" />
                    
                    <div className={`relative z-10 w-14 h-14 mb-5 flex items-center justify-center rounded-2xl border transition-all duration-500 shadow-sm ${sty.iconBg || 'bg-white/10 text-white/90 group-hover:bg-white group-hover:text-black'} ${sty.iconBorder || 'border-white/10'} group-hover:scale-110 group-hover:rotate-[6deg] group-hover:-translate-y-1`}>
                      <Icon size={20} strokeWidth={1.8} className="transition-transform duration-500" />
                    </div>

                    <div className="relative z-10">
                      <p className={`text-[11px] font-black text-white tracking-wider uppercase mb-1.5 transition-colors duration-300 ${sty.textHover || ''}`}>
                        {meta.label}
                      </p>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-500 bg-zinc-600 ${sty.dotColor ? `group-hover:${sty.dotColor} group-hover:animate-pulse group-hover:scale-110` : 'group-hover:bg-white'}`} />
                        <p className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase transition-colors group-hover:text-zinc-200">
                          {count} Options
                        </p>
                      </div>
                    </div>

                    <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-1 group-hover:translate-y-0 text-white/50 transition-colors duration-300 ${sty.accentColor ? `group-hover:${sty.accentColor}` : 'group-hover:text-white'}`}>
                      <ArrowUpRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ─── NEW INTERACTIVE SYMPTOM DIAGNOSTICS MATCHER ───────────────── */}
          <div className="bg-zinc-50 border border-zinc-150 p-6 md:p-10 rounded-[2rem] relative overflow-hidden bento-grid-bg">
            <div className="max-w-xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-[9px] font-black tracking-widest uppercase mb-4 shadow-sm">
                <Wrench size={10} className="text-amber-400 animate-spin-slow" />
                Appliance Diagnoser
              </div>
              <h3 className="text-3xl font-black text-black tracking-tight leading-none mb-3">
                Trouble with an appliance?
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Select your appliance and match the symptom to instantly uncover the recommended fix, price, and duration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Tab Selector */}
              <div className="md:col-span-3 lg:col-span-3 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide shrink-0 snap-x snap-mandatory">
                {Object.entries(DIAGNOSTICS_DATA).map(([key, data]) => {
                  const Icon = CATEGORY_ICONS[key] || Sparkles;
                  return (
                    <button
                      key={key}
                      onClick={() => handleDiagTabChange(key)}
                      className={`flex items-center gap-3 px-5 py-4 text-xs font-black tracking-widest uppercase border rounded-xl text-left transition-all shrink-0 snap-center ${diagTab === key ? "bg-black border-black text-white shadow-lg" : "bg-white border-zinc-200 text-zinc-500 hover:border-black hover:text-black"}`}
                    >
                      <Icon size={14} />
                      <span className="truncate">{data.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Virtual Hotspot Display */}
              <div className="md:col-span-5 lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl h-[280px] relative overflow-hidden flex items-center justify-center p-8 group shadow-inner">
                {/* Dark diagonal stripe back-hatch */}
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "12px 12px" }} />
                
                {/* Appliance Outline Mockup rendering */}
                <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
                  {diagTab === "ac" && (
                    <div className="w-[180px] h-[55px] bg-white/5 border border-white/10 rounded-lg relative flex flex-col justify-between p-1.5 transition-all group-hover:scale-105 duration-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1 right-2 animate-pulse" />
                      <div className="flex justify-between items-center text-[7px] text-white/30 font-bold px-1.5 uppercase tracking-widest">
                        <span>Cooling Unit</span>
                        <span>1.5 Ton</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full my-auto" />
                      <div className="w-full h-2.5 bg-gradient-to-b from-white/10 to-transparent flex gap-0.5 justify-center items-center">
                        <span className="w-0.5 h-1 bg-white/20 animate-pulse" />
                        <span className="w-0.5 h-1 bg-white/20 animate-pulse delay-100" />
                        <span className="w-0.5 h-1 bg-white/20 animate-pulse delay-200" />
                      </div>
                      
                      {/* Nested hotspots for AC to guarantee perfect coordination on any display */}
                      {DIAGNOSTICS_DATA.ac.symptoms.map(s => {
                        const isActive = selectedSymptom?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSymptom(s)}
                            style={{ left: s.hotspot.x, top: s.hotspot.y }}
                            className={`absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 ${isActive ? "scale-125" : "hover:scale-110"}`}
                          >
                            <span className={`absolute inset-0 rounded-full opacity-60 border animate-ping ${DIAGNOSTICS_DATA.ac.pulseColor}`} />
                            <span className={`w-3.5 h-3.5 rounded-full border border-white shadow-md flex items-center justify-center text-[7px] font-black text-white transition-colors ${isActive ? "bg-white text-zinc-950" : "bg-black"}`}>
                              !
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {diagTab === "fridge" && (
                    <div className="w-[85px] h-[150px] bg-white/5 border border-white/10 rounded-lg relative flex flex-col p-1.5 gap-1 group-hover:scale-105 transition-all duration-500">
                      {/* Freezer handle */}
                      <div className="w-1 h-12 bg-white/30 rounded-full absolute top-6 right-1.5" />
                      {/* Upper freezer compartment */}
                      <div className="h-[55px] w-full border border-white/5 bg-white/[0.02] rounded flex items-center justify-center">
                        <span className="text-[6px] text-white/20 font-bold uppercase tracking-widest">Freezer</span>
                      </div>
                      {/* Fresh food compartment */}
                      <div className="flex-1 w-full border border-white/5 bg-white/[0.02] rounded flex items-center justify-center">
                        <span className="text-[6px] text-white/20 font-bold uppercase tracking-widest">Fresh Zone</span>
                      </div>

                      {/* Nested hotspots for Fridge to guarantee perfect coordination on any display */}
                      {DIAGNOSTICS_DATA.fridge.symptoms.map(s => {
                        const isActive = selectedSymptom?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSymptom(s)}
                            style={{ left: s.hotspot.x, top: s.hotspot.y }}
                            className={`absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 ${isActive ? "scale-125" : "hover:scale-110"}`}
                          >
                            <span className={`absolute inset-0 rounded-full opacity-60 border animate-ping ${DIAGNOSTICS_DATA.fridge.pulseColor}`} />
                            <span className={`w-3.5 h-3.5 rounded-full border border-white shadow-md flex items-center justify-center text-[7px] font-black text-white transition-colors ${isActive ? "bg-white text-zinc-950" : "bg-black"}`}>
                              !
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {diagTab === "electrical" && (
                    <div className="w-[100px] h-[120px] bg-white/5 border border-white/10 rounded-xl relative flex flex-col p-3 gap-2 justify-between group-hover:scale-105 transition-all duration-500">
                      <div className="grid grid-cols-3 gap-1">
                        {[1,2,3,4,5,6].map(i => (
                           <div key={i} className="h-5 bg-white/5 rounded border border-white/10 flex items-center justify-center p-0.5">
                             <div className={`w-1 h-3 rounded ${i === 2 ? "bg-amber-400" : "bg-white/20"}`} />
                           </div>
                        ))}
                      </div>
                      <div className="text-[6px] text-white/25 font-bold uppercase tracking-wider text-center">Breaker Panel</div>

                      {/* Nested hotspots for Electrical to guarantee perfect coordination on any display */}
                      {DIAGNOSTICS_DATA.electrical.symptoms.map(s => {
                        const isActive = selectedSymptom?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSymptom(s)}
                            style={{ left: s.hotspot.x, top: s.hotspot.y }}
                            className={`absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 ${isActive ? "scale-125" : "hover:scale-110"}`}
                          >
                            <span className={`absolute inset-0 rounded-full opacity-60 border animate-ping ${DIAGNOSTICS_DATA.electrical.pulseColor}`} />
                            <span className={`w-3.5 h-3.5 rounded-full border border-white shadow-md flex items-center justify-center text-[7px] font-black text-white transition-colors ${isActive ? "bg-white text-zinc-950" : "bg-black"}`}>
                              !
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Symptom Diagnostics Report Detail Box */}
              <div className="md:col-span-4 lg:col-span-4 bg-white border border-zinc-200 p-6 rounded-2xl h-[280px] flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-500">
                {selectedSymptom ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex gap-2 items-start">
                        <span className="w-5 h-5 shrink-0 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-600">
                          <ShieldAlert size={10} strokeWidth={3} />
                        </span>
                        <div>
                          <p className="text-[9px] font-black tracking-widest uppercase text-zinc-400 leading-none">Diagnosed Issue</p>
                          <p className="text-sm font-black text-black tracking-tight mt-1">{selectedSymptom.issue}</p>
                        </div>
                      </div>

                      <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Potential Root Cause</p>
                        <p className="text-xs text-zinc-550 leading-normal font-medium">{selectedSymptom.cause}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-0.5">Recommended Fix</p>
                        <p className="text-xs font-black text-black uppercase tracking-tight">{selectedSymptom.recommended}</p>
                        <p className="text-lg font-black text-black tracking-tight mt-0.5">{formatPrice(selectedSymptom.price)}</p>
                      </div>
                      
                      <Link
                        href={`/book/${selectedSymptom.slug}`}
                        className="inline-flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md transition-colors"
                      >
                        Book Fix <ArrowRight size={10} strokeWidth={3} />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <Info size={24} className="text-zinc-300 mb-2" />
                    <p className="text-xs text-zinc-400 font-semibold">Click any pulsing hotspot to diagnose</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR SERVICES ─────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-zinc-50/50 border-b border-zinc-100 animate-reveal-up animation-delay-100">
        <div className="max-w-7xl mx-auto px-4 md:px-10">

          <div className="flex items-end justify-between mb-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-px bg-zinc-950" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">Most Booked</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black leading-[0.9]">
                Popular <span className="text-zinc-300">Services</span>
              </h2>
            </div>
            <Link href="/services/ac"
              className="group flex items-center gap-2.5 text-[10px] font-black tracking-widest uppercase text-black">
              View All 
              <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-300">
                <ChevronRight size={12} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularServices.map(svc => {
              const cat  = Object.entries(SERVICE_CATALOG).find(([, a]) => a.includes(svc))?.[0] || "ac";
              const meta = CATEGORY_META[cat];
              const Icon = CATEGORY_ICONS[cat] || Sparkles;
              const imageUrl = SERVICE_IMAGES[svc.slug] || DEFAULT_SERVICE_IMAGE;
              const sty = CAT_STYLES[cat] || {};
              return (
                <div 
                  key={svc.slug} 
                  onClick={() => setQuickViewService(svc)}
                  className={`group relative bg-white border border-zinc-200 hover:border-black/5 transition-all duration-500 flex flex-col rounded-2xl overflow-hidden cursor-pointer h-full smooth-lift hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] ${sty.hoverBorder ? `hover:!border-black/5 ${sty.hoverBorder}` : ''} ${sty.hoverGlow ? `hover:${sty.hoverGlow}` : ''}`}
                >
                  {/* Top image container with hover zoom */}
                  <div className="relative w-full h-[190px] overflow-hidden bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={svc.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-90" />
                    
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black tracking-widest uppercase text-white shadow-sm">
                      {meta.label}
                    </span>
                    
                    <span className={`absolute top-4 right-4 w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-zinc-100 text-black shadow-sm transition-all duration-500 group-hover:rotate-[8deg] group-hover:scale-115 ${sty.accentColor ? `group-hover:${sty.accentColor} group-hover:bg-zinc-950 group-hover:border-zinc-900 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]` : ''}`}>
                      <Icon size={15} strokeWidth={2.2} />
                    </span>
                  </div>

                  {/* Card Details Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[17px] font-black text-black tracking-tight mb-2.5 uppercase transition-colors duration-300 group-hover:text-black">
                        {svc.name}
                      </h3>

                      <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400 mb-5">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} strokeWidth={2.2} className="text-zinc-400" />
                          {svc.duration}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                        <span className="flex items-center gap-1 text-amber-500 font-extrabold bg-amber-50/80 border border-amber-100/40 px-2 py-0.5 rounded-md transition-all duration-300 group-hover:scale-105">
                          <Star size={11} fill="currentColor" strokeWidth={0} className="group-hover:animate-pulse" />
                          4.8
                        </span>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {svc.includes.slice(0, 3).map(item => (
                          <li key={item} className="flex items-center gap-2.5 text-xs text-zinc-550 font-medium transition-colors duration-300 group-hover:text-zinc-700">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0 transition-transform duration-500 group-hover:scale-110" strokeWidth={2.5} />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Card Footer Booking Bar */}
                    <div className="flex items-center justify-between pt-5 border-t border-zinc-100 mt-auto">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                          Starting at
                        </p>
                        <p className="text-[1.5rem] font-black text-black leading-none tracking-tight">
                          {formatPrice(svc.price)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 text-[9px] font-black tracking-widest uppercase transition-all duration-300 rounded-lg shadow-sm group-hover:bg-zinc-900 group-hover:scale-102 ${sty.dotColor ? `group-hover:shadow-[0_4px_20px_-4px_rgba(${sty.dotColor === 'bg-sky-500' ? '56,189,248' : sty.dotColor === 'bg-teal-500' ? '20,184,166' : sty.dotColor === 'bg-violet-500' ? '139,92,246' : sty.dotColor === 'bg-indigo-500' ? '99,102,241' : sty.dotColor === 'bg-cyan-500' ? '6,182,212' : sty.dotColor === 'bg-amber-500' ? '245,158,11' : '244,63,94'},0.35)]` : ''}`}>
                        View Details <ArrowRight size={11} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-10">

          <div className="mb-14 text-center">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-white/25 mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              3 steps to a fixed home
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06]">
            {STEPS.map((step, i) => (
              <div key={i} className="relative bg-zinc-950 p-8 md:p-10 hover:bg-zinc-900 transition-colors">
                <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/18 mb-7">
                  Step 0{i + 1}
                </p>
                <span className="w-12 h-12 inline-flex items-center justify-center border border-white/[0.10] bg-white/[0.04] mb-7">
                  <step.Icon size={20} strokeWidth={1.8} className="text-white/60" />
                </span>
                <h3 className="text-xl font-extrabold tracking-tight mb-3">{step.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{step.desc}</p>
                {i < 2 && (
                  <ChevronRight size={14} className="hidden md:block absolute top-1/2 -right-2.5 -translate-y-1/2 text-white/15 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────── */}
      <section className="py-24 md:py-36 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/[0.02] rounded-full pointer-events-none animate-[pulse_8s_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.02] rounded-full pointer-events-none animate-[pulse_12s_infinite]" />
        
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-full mb-8">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">Security & Integrity</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
              Built for <br className="hidden md:block" /> <span className="text-zinc-500">peace of mind</span>
            </h2>
            <p className="text-zinc-500 text-base max-w-xl mx-auto font-medium leading-relaxed">
              We&apos;ve engineered every step of the service journey to prioritize your safety, comfort, and absolute satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST.map((t, idx) => (
              <div key={t.label}
                className="group relative bg-zinc-900/30 backdrop-blur-sm border border-white/[0.04] p-10 md:p-12 hover:border-white/10 hover:bg-zinc-900/60 transition-all duration-700 cursor-default overflow-hidden">
                
                <span className="absolute -bottom-10 -right-6 text-[160px] font-black text-white/[0.01] group-hover:text-white/[0.03] transition-all duration-700 pointer-events-none tracking-tighter italic">
                  0{idx + 1}
                </span>

                <div className="absolute -top-20 -left-20 w-40 h-40 bg-white opacity-0 group-hover:opacity-[0.04] blur-[80px] transition-opacity duration-700" />

                <div className={`w-16 h-16 inline-flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 mb-10 transition-all duration-700 group-hover:scale-110 group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] text-white/30`}>
                  <t.Icon size={28} strokeWidth={1.2} />
                </div>
                
                <h3 className="text-xl font-black text-white mb-4 tracking-tight uppercase">{t.label}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed font-medium group-hover:text-zinc-300 transition-colors duration-500">
                  {t.desc}
                </p>

                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1)" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (HIGH FIDELITY EXPERIENCE HUB) ───────────────── */}
      <section className="py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-zinc-50 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-zinc-50 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-px bg-zinc-900" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">Social Proof</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black leading-tight">
                Real reviews, <br /> <span className="text-zinc-300">real customers</span>
              </h2>
            </div>
            
            {/* Reviews CTA Buttons & Rating Overview */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-black leading-none">4.8/5</p>
                  <Stars n={5} size={13} />
                </div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Based on 12.4K verified jobs</p>
              </div>
              
              <button 
                onClick={() => setIsReviewDrawerOpen(true)}
                className="bg-black text-white hover:bg-zinc-800 text-[10px] font-black tracking-widest uppercase px-5 py-3.5 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <MessageSquare size={12} strokeWidth={2.5} /> Share Experience
              </button>
            </div>
          </div>

          {/* Social Proof Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start mb-16">
            {/* Interactive Sidebar: Star Filter & Breakdown */}
            <div className="md:col-span-4 lg:col-span-4 bg-zinc-50 border border-zinc-150 p-6 rounded-[1.5rem] space-y-6 shadow-sm">
              <div>
                <h4 className="text-[11px] font-black tracking-widest uppercase text-black mb-1">Rating Breakdown</h4>
                <p className="text-xs text-zinc-400 font-medium">Click on any tier below to filter testimonials.</p>
              </div>

              <div className="space-y-3.5">
                {[5, 4, 3, 2, 1].map(stars => {
                  const dist = ratingDistribution[stars] || { count: 0, pct: 0 };
                  const isSelected = ratingFilter === stars;
                  return (
                    <button
                      key={stars}
                      onClick={() => setRatingFilter(isSelected ? null : stars)}
                      className={`w-full flex items-center gap-3 text-left group/star py-1 px-2 rounded-lg hover:bg-white transition-colors ${isSelected ? "bg-white border border-zinc-200 shadow-sm" : "border border-transparent"}`}
                    >
                      <span className="text-[10px] font-black tracking-tight text-zinc-600 w-3 shrink-0">{stars}★</span>
                      <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full transition-all duration-500" 
                          style={{ width: `${dist.pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 w-6 text-right shrink-0">{dist.pct}%</span>
                      <span className="text-[8px] font-black uppercase text-zinc-300 group-hover/star:text-black w-7 text-right shrink-0 transition-colors">
                        {isSelected ? "Clear" : "Filter"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Service Categories Filters */}
              <div className="pt-5 border-t border-zinc-200 space-y-3">
                <h4 className="text-[10px] font-black tracking-widest uppercase text-black">Filter by Services</h4>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "all", val: "All Reviews" },
                    { key: "ac", val: "AC Service" },
                    { key: "fridge", val: "Fridge" },
                    { key: "electrical", val: "Electrical" },
                    { key: "appliance", val: "Appliances" },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setCategoryFilter(tab.key)}
                      className={`px-3 py-1.5 text-[9px] font-black tracking-wider uppercase border transition-all ${categoryFilter === tab.key ? "bg-black border-black text-white" : "bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black"}`}
                    >
                      {tab.val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Badge Indicators */}
              <div className="pt-5 border-t border-zinc-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-black leading-none">100% Verified Work</p>
                  <p className="text-[8px] text-zinc-400 font-bold uppercase mt-1 leading-none">Aadhaar & Geolocation Tracked</p>
                </div>
              </div>
            </div>

            {/* Testimonials List Grid */}
            <div className="md:col-span-8 lg:col-span-8 space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((t, idx) => (
                  <div key={idx}
                    className="group relative bg-white border border-zinc-100 p-8 rounded-2xl transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-black flex flex-col min-h-[180px] animate-reveal-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <span className="absolute top-6 right-8 text-7xl font-black text-zinc-50 group-hover:text-zinc-100 transition-colors pointer-events-none leading-none select-none">
                      &ldquo;
                    </span>

                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <Stars n={t.rating} size={11} />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Verified Purchase</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-650 leading-relaxed group-hover:text-black transition-colors duration-300 italic">
                        &ldquo;{t.text}&rdquo;
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-50 flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-black shadow-md group-hover:scale-105 transition-transform duration-500">
                        {t.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-black truncate">{t.name}</p>
                        <div className="flex items-center gap-1.5 text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                          <span>{t.city}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-200" />
                          <span className="text-emerald-500">Verified</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-zinc-50 rounded-md border border-zinc-100">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">
                          {t.service}
                        </p>
                      </div>
                    </div>

                    <div className="absolute top-0 left-0 w-full h-[3px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-t-2xl" />
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <MessageSquare size={28} className="text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-400 uppercase">No matching reviews found</p>
                  <p className="text-[10px] text-zinc-450 mt-1">Try clearing some filter criteria above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROVIDER RECRUITMENT ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — copy */}
            <div>
              <Overline light>For Professionals</Overline>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5">
                Turn your skills into a stable income.
              </h2>
              <p className="text-white/40 text-base leading-relaxed mb-8 max-w-md">
                Join 2,000+ verified professionals already earning through ServiceMarket. Flexible hours, instant job alerts, and weekly direct payouts.
              </p>

              {/* Perks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-9">
                {PROVIDER_PERKS.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 shrink-0 border border-white/[0.09] bg-white/[0.04] flex items-center justify-center">
                      <Icon size={13} strokeWidth={1.8} className="text-white/45" />
                    </span>
                    <span className="text-sm text-white/55">{text}</span>
                  </div>
                ))}
              </div>

              <Link href="/provider"
                className="group inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-100 transition-colors">
                Apply as a Professional
                <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Right — earnings table */}
            <div className="lg:flex lg:justify-end">
              <div className="w-full max-w-sm border border-white/[0.09] bg-white/[0.03] p-7">
                <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-white/22 mb-7">
                  Estimated Monthly Earnings
                </p>
                <div>
                  {EARNINGS.map((row, i) => (
                    <div key={row.role}
                      className={`flex items-center justify-between py-4 ${i < EARNINGS.length - 1 ? "border-b border-white/[0.07]" : ""}`}>
                      <div>
                        <p className="text-sm font-bold text-white">{row.role}</p>
                        <p className="text-[10px] text-white/25 font-medium mt-0.5">{row.rate}</p>
                      </div>
                      <p className="text-sm font-extrabold text-emerald-400 shrink-0 ml-4">{row.earn}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/18 font-medium mt-6 leading-relaxed">
                  * Based on active professional averages on the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CITY COVERAGE ────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-b border-zinc-100 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* ── Left: headline + search + chips ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-px bg-zinc-900" />
                <p className="text-[10px] font-black tracking-[0.35em] uppercase text-zinc-400">
                  Expanding Rapidly
                </p>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.0] mb-6">
                Serving the{" "}
                <span className="text-zinc-300">nation</span>
              </h2>

              <p className="text-zinc-500 text-base font-medium leading-relaxed mb-8 max-w-md">
                From the bustling streets of Delhi to the tech hubs of Bengaluru, we bring expert home services to your doorstep across 25+ cities in India.
              </p>

              {/* Search bar */}
              <div className="flex max-w-sm mb-7 border border-zinc-200 bg-white focus-within:border-black transition-colors">
                <span className="flex items-center pl-4 text-zinc-400 shrink-0">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const q = citySearch.toLowerCase().trim();
                      const m = CITIES.find(c => c.toLowerCase().includes(q));
                      if (m) { setPinnedCity(m); setCitySearch(""); }
                    }
                  }}
                  placeholder="Search your state or district..."
                  className="flex-1 px-3 py-3.5 text-sm font-medium text-black placeholder:text-zinc-400 bg-transparent outline-none"
                />
                <button
                  onClick={() => {
                    const q = citySearch.toLowerCase().trim();
                    if (!q) return;
                    const m = CITIES.find(c => c.toLowerCase().includes(q));
                    if (m) { setPinnedCity(m); setCitySearch(""); }
                  }}
                  className="bg-black text-white px-5 text-[10px] font-black tracking-widest uppercase hover:bg-zinc-800 transition-colors shrink-0"
                >
                  Find
                </button>
              </div>

              {/* City chips */}
              <div className="flex flex-wrap gap-2">
                {(filteredCities.length > 0 ? filteredCities : CITIES).slice(0, 8).map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => { setPinnedCity(city); setCitySearch(""); }}
                    className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase border transition-all ${
                      activeCity === city
                        ? "bg-black text-white border-black"
                        : "bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black"
                    }`}
                  >
                    {city}
                  </button>
                ))}
                {filteredCities.length === 0 && citySearch && (
                  <p className="text-xs text-zinc-400 font-medium py-1.5">
                    No city found — expanding there soon!
                  </p>
                )}
                {!citySearch && (
                  <span className="px-4 py-2 bg-zinc-50 border border-dashed border-zinc-200 text-[10px] font-black tracking-widest uppercase text-zinc-400 select-none">
                    +{CITIES.length - 8} More
                  </span>
                )}
              </div>

              {/* Active city pill */}
              {activeCity && CITY_LANDMARKS[activeCity] && (
                <div className="mt-6 flex items-center gap-3 py-3 px-4 border border-zinc-100 bg-zinc-50 max-w-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Now showing</p>
                    <p className="text-sm font-extrabold text-black truncate">
                      {CITY_LANDMARKS[activeCity].label}
                      <span className="font-medium text-zinc-400 ml-1.5">
                        · {CITY_LANDMARKS[activeCity].state}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: 2×2 landmark grid ── */}
            <div className="relative">
              <div className="absolute -inset-3 bg-zinc-100 rounded-[1.5rem] -rotate-1 pointer-events-none" />

              <div className="relative grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden shadow-2xl shadow-zinc-300/60 h-[440px]">
                {gridItems.map((item, i) => {
                  if (item.kind === "img") {
                    return (
                      <CityImage
                        key={`${activeCity}-${i}`}
                        url={item.url}
                        landmark={item.landmark}
                        cityLabel={item.cityLabel}
                        gradient={item.gradient}
                      />
                    );
                  }

                  if (item.kind === "info") {
                    const city = CITY_LANDMARKS[activeCity];
                    return (
                      <div key="info" className="relative bg-zinc-950 p-5 flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.07]"
                          style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px,#fff 1px,transparent 0)", backgroundSize: "14px 14px" }} />
                        <div className="relative">
                          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">
                            City Guide
                          </p>
                          <p className="text-xl font-extrabold text-white leading-tight">
                            {city?.label}
                          </p>
                          <p className="text-sm text-zinc-400 mt-0.5 font-medium">{city?.state}</p>
                        </div>
                        <div className="relative space-y-2 mt-3">
                          {city?.images.map(img => (
                            <div key={img.landmark} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="text-[11px] text-zinc-400 font-medium truncate">{img.landmark}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (item.kind === "book") {
                    const city = CITY_LANDMARKS[activeCity];
                    return (
                      <div key="book" className="bg-black p-5 flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-3">
                            Available in {city?.label}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {["AC", "Fridge", "Fan", "TV", "Electrical", "Cooler"].map(s => (
                              <span key={s}
                                className="px-2 py-1 text-[9px] font-bold uppercase tracking-wide border border-white/10 text-white/40">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Link
                          href="/services/ac"
                          className="flex items-center gap-1.5 mt-4 text-[10px] font-bold tracking-widest uppercase text-white hover:text-zinc-300 transition-colors group"
                        >
                          Book in {city?.label}
                          <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-4 md:px-10 text-center">
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-zinc-400 mb-4">
            Get Started Today
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black mb-5">
            Ready for a service?
          </h2>
          <p className="text-zinc-500 text-base leading-relaxed mb-10 max-w-md mx-auto">
            Join 50,000+ customers who trust ServiceMarket for fast, reliable, and transparently-priced home services.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/services/ac"
              className="group inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors">
              Book a Service Now
              <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            {!user && (
              <Link href="/register"
                className="inline-flex items-center justify-center border border-zinc-300 text-black px-8 py-4 text-xs font-bold tracking-widest uppercase hover:border-black transition-colors">
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-10 pt-12 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                <img 
                  src="/logo-transparent.png" 
                  alt="ServiceMarket" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-base font-extrabold tracking-tight">
                  Service<span className="font-light text-zinc-400">Market</span>
                </span>
              </Link>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[195px]">
                Expert home services at your doorstep. Verified professionals, transparent pricing.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-4">Services</p>
              <ul className="space-y-2.5">
                {Object.entries(CATEGORY_META).map(([key, m]) => (
                  <li key={key}>
                    <Link href={`/services/${key}`}
                      className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors">
                      {m.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-4">Company</p>
              <ul className="space-y-2.5">
                {[
                  ["About Us",             "/about"],
                  ["How It Works",         "/how-it-works"],
                  ["Our Professionals",    "/providers"],
                  ["Become a Provider",    "/provider"],
                  ["Blog",                 "/blog"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-4">Support</p>
              <ul className="space-y-2.5">
                {[
                  ["Help Center",      "/help"],
                  ["Contact Us",       "/contact"],
                  ["My Bookings",      "/bookings"],
                  ["Terms of Service", "/terms"],
                  ["Privacy Policy",   "/privacy"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-7 border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 font-medium">
              © {new Date().getFullYear()} ServiceMarket · All rights reserved.
            </p>
            <p className="text-[10px] text-zinc-300 font-medium">
              Built with care for India&apos;s homes.
            </p>
          </div>
        </div>
      </footer>

      {/* ─── SLIDE-IN QUICK VIEW PANEL DRAWER ──────────────────────────────── */}
      {quickViewService && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop glass */}
          <div 
            onClick={() => setQuickViewService(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
          />
          
          {/* Drawer content frame */}
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col justify-between z-10 animate-reveal-left">
            <button 
              onClick={() => setQuickViewService(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black hover:border-black hover:bg-zinc-50 transition-all z-20"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8">
              {/* Product Header */}
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-650 text-[9px] font-black tracking-widest uppercase rounded-full mb-3">
                  <Sparkles size={9} className="text-amber-500" /> Premium Service Details
                </span>
                <h3 className="text-3xl font-black text-black tracking-tight leading-none uppercase">
                  {quickViewService.name}
                </h3>
                <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-zinc-450">
                  <span className="flex items-center gap-1"><Clock size={12} strokeWidth={2.5} /> {quickViewService.duration}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                  <span className="flex items-center gap-1 text-amber-500 font-black"><Star size={11} fill="currentColor" strokeWidth={0} /> 4.8 Rating</span>
                </div>
              </div>

              {/* Jet cleaning service image */}
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-zinc-150 border border-zinc-100">
                <img 
                  src={SERVICE_IMAGES[quickViewService.slug] || DEFAULT_SERVICE_IMAGE} 
                  alt={quickViewService.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* What is Included checklist */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black tracking-widest uppercase text-black">What is included</h4>
                <ul className="grid grid-cols-1 gap-2.5">
                  {quickViewService.includes.map((incl, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-zinc-650 font-medium">
                      <span className="w-5 h-5 shrink-0 bg-emerald-50 border border-emerald-150 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={11} strokeWidth={3} />
                      </span>
                      <span>{incl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions panel */}
              <div className="bg-zinc-50 border border-zinc-150 p-6 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-black tracking-widest uppercase text-black flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-zinc-500" strokeWidth={2.5} /> Important Exclusions
                </h4>
                <ul className="space-y-2 text-xs text-zinc-500 font-medium list-disc list-inside">
                  <li>Cost of replacement spare parts or copper piping (if required) is separate.</li>
                  <li>Structural masonry or wooden carpentry work is not included.</li>
                  <li>No additional visits or inspection charges apply post booking.</li>
                </ul>
              </div>

              {/* Stepper process flow */}
              <div className="space-y-5">
                <h4 className="text-[10px] font-black tracking-widest uppercase text-black">Standard service procedure</h4>
                <div className="relative border-l border-zinc-200 pl-6 ml-3.5 space-y-6">
                  {[
                    { label: "Safety & Pre-Service Inspection", desc: "Technician inspects structural integrity and tests functionality." },
                    { label: "Deep System Overhaul Fix", desc: "Execution of diagnostic cleaning, motor fixes or structural repairs." },
                    { label: "Post-Service Quality Checklist", desc: "Rigorous diagnostic safety tests to confirm seamless operation." },
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[35px] w-[18px] h-[18px] rounded-full bg-zinc-950 text-white flex items-center justify-center text-[8px] font-black shadow-md border border-white">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-black text-black uppercase leading-none">{step.label}</p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom pricing booking bar */}
            <div className="p-8 border-t border-zinc-150 bg-zinc-50/70 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black tracking-wider uppercase text-zinc-400">Total Price</p>
                <p className="text-3xl font-black text-black leading-none mt-1">{formatPrice(quickViewService.price)}</p>
              </div>
              <Link 
                href={`/book/${quickViewService.slug}`}
                className="inline-flex items-center gap-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold tracking-widest uppercase px-6 py-4 rounded-xl shadow-lg transition-colors"
              >
                Book This Service <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── REVIEW WRITER MODAL DRAWER ─────────────────────────────────── */}
      {isReviewDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsReviewDrawerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div className="bg-white border border-zinc-150 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative z-10 overflow-hidden animate-reveal-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsReviewDrawerOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-50 transition-all"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {submitSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                  <CheckCircle2 size={32} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-black text-black tracking-tight leading-none">Review Submitted!</h3>
                <p className="text-xs text-zinc-500 leading-normal">
                  Thank you for sharing your feedback. Your review will appear on the site after a quick approval check — usually within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full text-[9px] font-black tracking-widest uppercase text-zinc-600 mb-3">
                    <Star size={9} className="fill-amber-400 text-amber-400" /> Social Proof Hub
                  </div>
                  <h3 className="text-2xl font-black text-black tracking-tight leading-none">Share Your Review</h3>
                  <p className="text-[11px] text-zinc-450 mt-1">Help others pick the perfect verified home services.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 block mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Priyanjali Sen"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-black outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 block mb-1.5">City Location</label>
                      <select 
                        value={formCity}
                        onChange={e => setFormCity(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:bg-white focus:border-black outline-none transition-colors"
                      >
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 block mb-1.5">Service Type</label>
                      <select 
                        value={formCategory}
                        onChange={e => {
                          setFormCategory(e.target.value);
                          const mapping = { ac: "AC Service", fridge: "Fridge Repair", electrical: "Electrical Work", appliance: "Washing Machine" };
                          setFormService(mapping[e.target.value] || "Home Service");
                        }}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:bg-white focus:border-black outline-none transition-colors"
                      >
                        <option value="ac">AC Services</option>
                        <option value="fridge">Fridge Services</option>
                        <option value="electrical">Electrical Work</option>
                        <option value="appliance">Appliances</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 block mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(stars => (
                        <button
                          type="button"
                          key={stars}
                          onClick={() => setFormRating(stars)}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${formRating >= stars ? "bg-amber-50 border-amber-300 text-amber-500" : "bg-zinc-50 border-zinc-200 text-zinc-300 hover:border-zinc-300"}`}
                        >
                          <Star size={16} fill={formRating >= stars ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black tracking-wider uppercase text-zinc-400 block mb-1.5">Your Experience</label>
                    <textarea 
                      required
                      rows={3}
                      value={formText}
                      onChange={e => setFormText(e.target.value)}
                      placeholder="Write how the pro fixed your issue. How was their behavior, safety standard, or pricing transparency?"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-black outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-black hover:bg-zinc-800 text-white font-black tracking-widest uppercase py-4 rounded-xl text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ThumbsUp size={12} strokeWidth={2.5} /> Submit Verified Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
