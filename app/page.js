"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, performLogout, validateSession, saveAuthSession, clearAuthSession } from "@/lib/auth";
import { CATEGORY_META, SERVICE_CATALOG, formatPrice } from "@/lib/services";
import LocationBar from "@/components/LocationBar";
import SmartSearch from "@/components/SmartSearch";
import NotificationBell from "@/components/NotificationBell";
import SiteFooter from "@/components/SiteFooter";
import CategoryRow from "@/components/CategoryRow";
import { WorldMap } from "@/components/ui/map";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Fan,
  Flame,
  MapPin,
  Monitor,
  Plug,
  Quote,
  Refrigerator,
  Repeat2,
  Search,
  ShieldCheck,
  AirVent,
  Armchair,
  Bath,
  Bug,
  Car,
  Flower2,
  Hand,
  Paintbrush,
  Scissors,
  Shirt,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
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
  UserRound,
  LogOut,
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
    text:    "Had an electrical fault for weeks. The EliteCrew technician diagnosed and fixed it in 30 minutes. Clean work, zero mess.",
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
  {
    name:    "Arjun Nair",
    city:    "Pune",
    rating:  5,
    avatar:  "AN",
    category: "ac",
    service: "AC Installation",
    text:    "Flawless split-AC installation. The team arrived on time, mounted it perfectly, and walked me through the warranty. Truly five-star service.",
  },
];

const CITIES = [
  "New Delhi", "Ranchi", "Kolkata", "Mumbai", "Bengaluru",
  "Jamshedpur", "Dhanbad", "Patna", "Hyderabad", "Chennai", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
];

// Popular quick-pick chips for the place explorer.
const POPULAR_PLACES = [
  "New Delhi", "Ranchi", "Kolkata", "Mumbai", "Bengaluru", "Jamshedpur", "Patna", "Hyderabad",
];

// Fallback gradients for spot tiles that have no preview image.
const TILE_GRADIENTS = ["bg-zinc-900", "bg-blue-950", "bg-emerald-950", "bg-rose-950"];

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
  ac:        AirVent,
  cooler:    Wind,
  fan:       Fan,
  tv:        Monitor,
  fridge:    Refrigerator,
  electrical:Zap,
  appliance: Plug,
  cleaning:  Sparkles,
  plumbing:  Bath,
  carpentry: Armchair,
  "pest-control": Bug,
  painting:  Paintbrush,
  laundry:   Shirt,
  "car-wash": Car,
  beauty:    Hand,
  grooming:  Scissors,
  moving:    Truck,
  gardening: Flower2,
};

// Local demand signals used to rank + enrich the category cards.
// Ordered for a hot Indian summer (AC / cooler / fan lead the demand).
const CATEGORY_INSIGHTS = {
  ac:         { demand: 98, booked: "2.4k", rating: 4.9, eta: "in 60 min" },
  cooler:     { demand: 91, booked: "1.8k", rating: 4.8, eta: "in 90 min" },
  fan:        { demand: 84, booked: "1.2k", rating: 4.8, eta: "same day"  },
  fridge:     { demand: 73, booked: "940",  rating: 4.7, eta: "same day"  },
  electrical: { demand: 66, booked: "1.1k", rating: 4.8, eta: "in 60 min" },
  cleaning:   { demand: 64, booked: "1.3k", rating: 4.8, eta: "same day"  },
  appliance:  { demand: 58, booked: "760",  rating: 4.7, eta: "same day"  },
  plumbing:   { demand: 54, booked: "680",  rating: 4.7, eta: "in 90 min" },
  laundry:    { demand: 52, booked: "720",  rating: 4.7, eta: "next day"  },
  "car-wash": { demand: 50, booked: "610",  rating: 4.7, eta: "same day"  },
  tv:         { demand: 49, booked: "540",  rating: 4.7, eta: "next day"  },
  carpentry:  { demand: 45, booked: "430",  rating: 4.6, eta: "same day"  },
  "pest-control": { demand: 43, booked: "390", rating: 4.7, eta: "next day" },
  painting:   { demand: 39, booked: "310",  rating: 4.6, eta: "next day"  },
  beauty:     { demand: 37, booked: "520",  rating: 4.8, eta: "same day"  },
  grooming:   { demand: 35, booked: "470",  rating: 4.7, eta: "same day"  },
  moving:     { demand: 31, booked: "220",  rating: 4.6, eta: "scheduled" },
  gardening:  { demand: 28, booked: "180",  rating: 4.6, eta: "scheduled" },
};

// Categories are clustered into intent groups. 18 equal-weight cards force the
// user to read every one; four labelled clusters let them skip straight to the
// job they came for. Order inside a group follows CATEGORY_INSIGHTS demand.
const CATEGORY_GROUPS = [
  {
    id:    "repair",
    title: "Appliance & Cooling Repair",
    blurb: "Same-day fixes for the machines you can't live without",
    keys:  ["ac", "cooler", "fan", "fridge", "appliance", "tv"],
  },
  {
    id:    "home",
    title: "Home Repairs & Improvement",
    blurb: "Wiring, leaks, fittings and finishes — done properly",
    keys:  ["electrical", "plumbing", "carpentry", "painting"],
  },
  {
    id:    "cleaning",
    title: "Cleaning & Pest Control",
    blurb: "Deep cleans and treatments that actually last",
    keys:  ["cleaning", "pest-control", "car-wash", "gardening"],
  },
  {
    id:    "personal",
    title: "Personal Care & Daily Help",
    blurb: "Salon-grade care and everyday errands at your door",
    keys:  ["beauty", "grooming", "laundry", "moving"],
  },
];

// Static catalog size per category — the floor that live services add to.
const CATEGORY_STATIC_COUNTS = Object.fromEntries(
  Object.entries(SERVICE_CATALOG).map(([k, a]) => [k, a.length])
);

// Real service photography for the image-led category cards (Urban Company style).
const CATEGORY_PHOTOS = {
  ac:         "/images/ac_repair.png",
  cooler:     "/images/cooler_repair.png",
  fan:        "/images/fan_repair.png",
  tv:         "/images/tv_repair.png",
  fridge:     "/images/fridge_repair.png",
  electrical: "/images/electrical_work.png",
  appliance:  "/images/appliance_repair.png",
  cleaning:   "/images/cleaning.png",
  plumbing:   "/images/plumbing.png",
  carpentry:  "/images/carpentry.png",
  "pest-control": "/images/pest_control.png",
  painting:   "/images/painting.png",
  laundry:    "/images/laundry.png",
  "car-wash": "/images/car_wash.png",
  beauty:     "/images/beauty.png",
  grooming:   "/images/grooming.png",
  moving:     "/images/moving.png",
  gardening:  "/images/gardening.png",
};

const SERVICE_IMAGES = {
  "ac-repair": "/images/ac_repair.png",
  "ac-installation": "/images/ac_installation.png",
  "ac-deep-cleaning": "/images/ac_deep_cleaning.png",
  "ac-gas-refilling": "/images/ac_gas_refilling.png",
  "ac-uninstallation": "/images/ac_uninstallation.png",
  
  "cooler-repair": "/images/cooler_repair.png",
  "cooler-service": "/images/cooler_service.png",
  "cooler-installation": "/images/cooler_installation.png",
  
  "fan-repair": "/images/fan_repair.png",
  "fan-installation": "/images/fan_installation.png",
  "fan-servicing": "/images/fan_servicing.png",
  
  "tv-repair": "/images/tv_repair.png",
  "tv-wall-mounting": "/images/tv_wall_mounting.png",
  
  "fridge-repair": "/images/fridge_repair.png",
  "fridge-gas-refill": "/images/fridge_gas_refill.png",
  
  "electrical-work": "/images/electrical_work.png",
  "wiring-cabling": "/images/wiring_cabling.png",
  
  "appliance-repair": "/images/appliance_repair.png",
  "washing-machine-repair": "/images/washing_machine_repair.png",

  // Cleaning
  "bathroom-deep-cleaning": "/images/cleaning.png",
  "kitchen-deep-cleaning": "/images/cleaning.png",
  "full-home-deep-cleaning": "/images/cleaning.png",
  "sofa-shampoo-cleaning": "/images/cleaning.png",
  "carpet-cleaning": "/images/cleaning.png",
  "mattress-cleaning": "/images/cleaning.png",
  "balcony-cleaning": "/images/cleaning.png",
  "move-in-move-out-cleaning": "/images/cleaning.png",
  "regular-housekeeping": "/images/cleaning.png",
  "window-glass-cleaning": "/images/cleaning.png",

  // Plumbing
  "tap-mixer-repair": "/images/plumbing.png",
  "toilet-flush-repair": "/images/plumbing.png",
  "drain-unclogging": "/images/plumbing.png",
  "water-tank-cleaning": "/images/plumbing.png",
  "pipe-leakage-repair": "/images/plumbing.png",

  // Carpentry
  "door-lock-installation": "/images/carpentry.png",
  "furniture-assembly": "/images/carpentry.png",
  "bed-repair": "/images/carpentry.png",
  "curtain-rod-installation": "/images/carpentry.png",
  "modular-furniture-repair": "/images/carpentry.png",

  // Pest Control
  "cockroach-pest-control": "/images/pest_control.png",
  "termite-treatment": "/images/pest_control.png",
  "bed-bug-treatment": "/images/pest_control.png",
  "mosquito-control": "/images/pest_control.png",

  // Painting
  "single-wall-painting": "/images/painting.png",
  "room-painting": "/images/painting.png",
  "wall-dampness-repair": "/images/painting.png",
  "texture-wall-painting": "/images/painting.png",

  // Laundry
  "cloth-wash-fold": "/images/laundry.png",
  "dry-cleaning": "/images/laundry.png",
  "steam-ironing": "/images/laundry.png",
  "shoe-cleaning": "/images/laundry.png",
  "curtain-laundry": "/images/laundry.png",

  // Car Wash
  "car-exterior-wash": "/images/car_wash.png",
  "car-interior-cleaning": "/images/car_wash.png",
  "car-deep-cleaning": "/images/car_wash.png",
  "bike-wash": "/images/car_wash.png",

  // Beauty
  "women-haircut-at-home": "/images/beauty.png",
  "facial-cleanup": "/images/beauty.png",
  "manicure-pedicure": "/images/beauty.png",
  "waxing-service": "/images/beauty.png",

  // Grooming
  "men-haircut-at-home": "/images/grooming.png",
  "beard-styling": "/images/grooming.png",
  "head-massage": "/images/grooming.png",

  // Moving
  "packers-movers-survey": "/images/moving.png",
  "home-shifting-help": "/images/moving.png",
  "furniture-moving-help": "/images/moving.png",

  // Gardening
  "garden-maintenance": "/images/gardening.png",
  "plant-care-visit": "/images/gardening.png",
  "lawn-mowing": "/images/gardening.png",
};

const DEFAULT_SERVICE_IMAGE = "/images/default_service.png";

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
    image: "/images/ac.webp",
    bg: "#212121",
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
    image: "/images/refrigerator.webp",
    bg: "#0e1313",
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
    image: "/images/electricboard.webp",
    bg: "#26272b",
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

// ─── SpotTile ────────────────────────────────────────────────────────────────
// One featured-place tile in the explorer grid. Image already resolved by the
// backend; falls back to a textured gradient if missing or it fails to load.
function SpotTile({ image, name, category, placeLabel, gradient, loading }) {
  const [failed, setFailed] = useState(false);
  const show = !!image && !failed;

  return (
    <div className={`relative w-full h-full min-h-0 overflow-hidden ${show ? "bg-zinc-900" : (gradient || "bg-zinc-900")}`}>

      {loading && <div className="absolute inset-0 bg-zinc-800 animate-pulse" />}

      {!show && !loading && (
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "8px 8px" }} />
      )}

      {show && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={`${name} — ${placeLabel}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        </>
      )}

      {!loading && (
        <div className="absolute bottom-0 left-0 right-0 bg-white px-4 py-3">
          <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-zinc-400 mb-0.5">
            {category || "Featured Spot"}
          </p>
          <p className="text-[13px] font-extrabold text-black tracking-tight leading-tight truncate">{name || placeLabel}</p>
          <p className="text-[10px] text-zinc-500 font-medium truncate">{placeLabel}</p>
        </div>
      )}
    </div>
  );
}

// ─── Account menu (logged-in navbar dropdown) ─────────────────────────────────

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initials = (user?.fullName || "U")
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { label: "My Profile",   href: "/profile",           Icon: UserRound    },
    { label: "My Bookings",  href: "/bookings",          Icon: CalendarDays },
    { label: "Saved Addresses", href: "/profile#addresses", Icon: MapPin    },
    { label: "Help & Support",  href: "/support",        Icon: MessageSquare },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 group"
      >
        <span className={`w-9 h-9 rounded-full bg-zinc-950 text-white text-[11px] font-black flex items-center justify-center ring-2 transition-all ${
          open ? "ring-zinc-300" : "ring-transparent group-hover:ring-zinc-200"
        }`}>
          {initials}
        </span>
        <ChevronDown size={13} className={`text-zinc-400 transition-transform duration-200 hidden sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl border border-zinc-100 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Identity header */}
          <div className="px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
            <p className="text-sm font-extrabold text-zinc-900 truncate">{user.fullName}</p>
            <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">{user.email}</p>
          </div>

          <div className="py-1.5">
            {items.map(({ label, href, Icon }) => (
              <Link key={label} href={href} role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-black transition-colors">
                <Icon size={15} strokeWidth={1.9} className="text-zinc-400" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-zinc-100 py-1.5">
            <button role="menuitem"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={15} strokeWidth={1.9} />
              Sign Out
            </button>
          </div>
        </div>
      )}
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

  // Live admin-created services enrich the category cards: uploaded photos,
  // real counts and real starting prices — so a new category like "cleaning"
  // is never a blank card. Static catalog stays as the instant fallback.
  const [liveByCat, setLiveByCat] = useState({});
  useEffect(() => {
    const absUrl = (u) => {
      if (!u) return null;
      if (/^https?:\/\//i.test(u)) return u;
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
    };
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success || !Array.isArray(d.services)) return;
        const byCat = {};
        for (const s of d.services) {
          if (s.active === false || !s.category) continue;
          const cur = byCat[s.category] || { slugs: new Set(), minPrice: null, image: null, firstName: null };
          cur.slugs.add(s.slug);
          const price = Number(s.basePrice);
          if (Number.isFinite(price) && (cur.minPrice === null || price < cur.minPrice)) cur.minPrice = price;
          if (!cur.image && s.images?.length) cur.image = absUrl(s.images[0]);
          if (!cur.firstName || s.isPopular) cur.firstName = s.name;
          byCat[s.category] = cur;
        }
        setLiveByCat(byCat);
      })
      .catch(() => {});
  }, []);

  // One resolved record per category, shared by the spotlight cards and the
  // grouped tiles below them so both always agree on price/count/photo.
  const catStats = useMemo(() => {
    const out = {};
    for (const [key, meta] of Object.entries(CATEGORY_META)) {
      if (key === "other") continue;
      const services = SERVICE_CATALOG[key] || [];
      const live     = liveByCat[key];

      // Merge static + live: count dedupes by slug, price takes the true
      // minimum, photo prefers the curated shot then the first uploaded one.
      const staticSlugs = new Set(services.map(s => s.slug));
      const liveOnly    = live ? [...live.slugs].filter(sl => !staticSlugs.has(sl)).length : 0;
      const staticMin   = services.length ? Math.min(...services.map(s => s.price)) : null;
      const prices      = [staticMin, live?.minPrice].filter(v => v != null);

      out[key] = {
        key,
        meta,
        ins:      CATEGORY_INSIGHTS[key] || { demand: 50, booked: "100", rating: 4.7, eta: "same day" },
        count:    (CATEGORY_STATIC_COUNTS[key] || 0) + liveOnly,
        minPrice: prices.length ? Math.min(...prices) : null,
        popular:  services.find(s => s.popular) || services[0] || (live?.firstName ? { name: live.firstName } : null),
        photo:    live?.image || CATEGORY_PHOTOS[key] || null,
      };
    }
    return out;
  }, [liveByCat]);

  // Only the three genuinely hottest categories get a full-size card — badges
  // like "Most booked" mean nothing when every tile shouts equally loud.
  const spotlightCats = useMemo(
    () => Object.values(catStats).sort((a, b) => b.ins.demand - a.ins.demand).slice(0, 3),
    [catStats]
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

  // ─── Place explorer (OpenTripMap-powered) ──────────────────────────
  const [citySearch,   setCitySearch]   = useState("");
  const [exploreQuery, setExploreQuery] = useState("New Delhi");
  const [explore, setExplore] = useState({ loading: true, error: false, place: { name: "New Delhi" }, spots: [] });

  // Commit a search (chip / Find button / Enter). Loading is flagged here so we
  // never call setState synchronously inside the fetch effect below.
  const runExplore = (name) => {
    const q = (name || "").trim();
    if (!q) return;
    setExplore(s => ({ ...s, loading: true, error: false }));
    setExploreQuery(q);
    setCitySearch("");
  };

  useEffect(() => {
    if (!exploreQuery) return;
    let cancelled = false;
    fetch(`/api/places/explore?name=${encodeURIComponent(exploreQuery)}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (!d || !d.success) {
          setExplore({ loading: false, error: true, place: { name: exploreQuery }, spots: [] });
          return;
        }
        setExplore({
          loading: false,
          error: false,
          place: d.place || { name: exploreQuery },
          spots: d.spots || [],
        });
      })
      .catch(() => {
        if (!cancelled) setExplore({ loading: false, error: true, place: { name: exploreQuery }, spots: [] });
      });
    return () => { cancelled = true; };
  }, [exploreQuery]);

  const placeLabel = explore.place?.name || exploreQuery;
  const imageSpots = (explore.spots || []).filter(s => s.image).slice(0, 2);
  const guideSpots = (explore.spots || []).slice(0, 5);

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

  useEffect(() => {
    fetch("/api/testimonials")
      .then(r => r.json())
      .then(d => { if (d.success && d.testimonials?.length) setTestimonials(d.testimonials); })
      .catch(() => {}); // silently fall back to INITIAL_TESTIMONIALS on error
  }, []);

  // ─── Reviews carousel: show up to 6, auto-slide + manual nav ──────────
  const reviews = useMemo(() => testimonials.slice(0, 6), [testimonials]);
  const [reviewSlide, setReviewSlide] = useState(0);
  const [reviewPaused, setReviewPaused] = useState(false);

  // Clamp at render so a shrinking review list never points at a missing slide.
  const activeSlide = reviews.length ? Math.min(reviewSlide, reviews.length - 1) : 0;

  // Auto-advance every 5s unless the user is hovering/interacting.
  useEffect(() => {
    if (reviewPaused || reviews.length <= 1) return;
    const id = setInterval(() => {
      setReviewSlide(s => (s + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(id);
  }, [reviewPaused, reviews.length]);

  const goPrevReview = () => setReviewSlide((activeSlide - 1 + reviews.length) % reviews.length);
  const goNextReview = () => setReviewSlide((activeSlide + 1) % reviews.length);
  
  // Custom Reviews drawer open/close
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Delhi");
  const [formRating, setFormRating] = useState(5);
  const [formCategory, setFormCategory] = useState("ac");
  const [formService, setFormService] = useState("AC Service");
  const [formText, setFormText] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
      <div className="bg-zinc-950 border-b border-zinc-800 py-3.5 text-center">
        <p className="text-[11px] md:text-xs font-semibold text-white/45 tracking-wide">
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
                alt="EliteCrew" 
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
            </div>
            <span className="hidden sm:block text-base font-extrabold tracking-tight">
              Elite<span className="font-light text-zinc-400">Crew</span>
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
                      className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors border border-zinc-200 rounded-lg px-3 py-1.5 hover:border-zinc-400">
                      <CalendarDays size={13} /> Bookings
                    </Link>
                    <NotificationBell variant="light" />
                    <AccountMenu user={user} onLogout={logout} />
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

      {/* ── HERO (warm / light) ──────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-white via-white to-zinc-50 overflow-hidden border-b border-zinc-100">
        {/* Soft warm ambient accents */}
        <div className="pointer-events-none absolute -top-32 -right-24 w-[520px] h-[520px] bg-emerald-100/45 rounded-full blur-[130px]" />
        <div className="pointer-events-none absolute bottom-0 -left-28 w-[420px] h-[420px] bg-amber-50 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-10 pt-4 pb-12 md:pt-6 md:pb-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">

            {/* LEFT — content */}
            <div>
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black tracking-tight leading-[1.05] text-black mb-5">
                Fix anything at home,{" "}
                <span className="text-emerald-600">with experts you trust.</span>
              </h1>

              <p className="text-zinc-500 text-base md:text-lg max-w-[520px] mb-7 leading-relaxed">
                AC, fridge, washing machine, wiring &amp; more — book a background-verified
                pro in minutes. Upfront prices, and you only pay once the job&rsquo;s done.
              </p>

              {/* Search box */}
              <div className="mb-4">
                <SmartSearch role={user?.role === "customer" ? "customer" : "public"} />
              </div>

              {/* Quick category chips */}
              <div className="flex flex-wrap items-center gap-2 mb-7">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-0.5">Popular:</span>
                {[
                  { label: "AC Service",       href: "/services/ac" },
                  { label: "Fridge",           href: "/services/fridge" },
                  { label: "Electrician",      href: "/services/electrical" },
                  { label: "Fan",              href: "/services/fan" },
                  { label: "Washing Machine",  href: "/services/appliance" },
                ].map(c => (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-[11px] font-bold text-zinc-600 hover:border-black hover:text-black hover:shadow-sm transition-all"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>

              {/* Location + browse */}
              <div className="flex flex-wrap items-center gap-3 mb-9">
                <LocationBar compact onLocationChange={setLocation} />
                <Link
                  href="#categories"
                  className="group inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors"
                >
                  Browse All Services
                  <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-zinc-100 pt-6">
                {STATS.map(({ value, label, Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={16} className="text-emerald-500 shrink-0" strokeWidth={2} />
                    <span className="text-sm font-black text-black">{value}</span>
                    <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — services showcase (4 real jobs we solve) */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-3 md:gap-4 rounded-[2rem] bg-white p-3 md:p-4 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)] border border-zinc-100">
                {[
                  { src: "/hero/acrepair.webp",   label: "AC Repair & Service", href: "/services/ac" },
                  { src: "/hero/fridges.webp",    label: "Fridge Repair",       href: "/services/fridge" },
                  { src: "/hero/electrician.webp",label: "Electrical Work",     href: "/services/electrical" },
                  { src: "/hero/washing.webp",    label: "Washing Machine",     href: "/services/appliance" },
                ].map((item, i) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group/tile relative block aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-100"
                  >
                    <Image
                      src={item.src}
                      alt={item.label}
                      fill
                      priority={i < 2}
                      sizes="(max-width: 1024px) 45vw, 24vw"
                      className="object-cover transition-transform duration-700 group-hover/tile:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <span className="absolute bottom-2.5 left-3 right-3 text-white text-[11px] md:text-xs font-black tracking-tight leading-tight drop-shadow-sm">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Floating rating card */}
              <div className="absolute -top-4 right-4 sm:-right-4 bg-white rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] border border-zinc-100 px-4 py-2.5 flex items-center gap-2">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <span className="text-sm font-black text-black">4.8</span>
                <span className="text-[10px] text-zinc-400 font-bold">/5</span>
              </div>

              {/* Floating verified card */}
              <div className="absolute -bottom-5 left-4 sm:-left-5 bg-white rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] border border-zinc-100 px-4 py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-black text-black leading-none">KYC-Verified Pro</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Aadhaar + Police Check</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES ───────────────────────────────────────── */}
      <section id="categories" className="py-16 md:py-24 relative overflow-hidden bg-white border-b border-zinc-100 animate-reveal-up">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '64px 64px'}} 
        />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="flex items-center justify-between gap-5 mb-8 md:mb-10">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-emerald-600 mb-2">
                Our services
              </p>
              <h2 className="text-2xl md:text-[2rem] font-bold tracking-tight text-zinc-900 leading-tight">
                Browse by category
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                {location
                  ? <>Ranked by what&rsquo;s most booked in <span className="font-semibold text-zinc-700">{location.city}</span></>
                  : "Pick a service and book a verified pro in minutes"}
              </p>
            </div>
            <Link href="/services/ac"
              className="group hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 shrink-0 px-4 py-2.5 rounded-full border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all duration-300">
              View all
              <ChevronRight size={15} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* ── Tier 1: spotlight ────────────────────────────────────────
              Only the three highest-demand categories get a full-size card.
              Everything below is a compact tile, so these actually read as
              recommendations instead of eighteen identical shouting boxes. */}
          <div className="grid gap-4 md:gap-5 lg:grid-cols-4 lg:grid-rows-2 mb-16">
            {spotlightCats.map(({ key, meta, ins, count, minPrice, popular, photo }, idx) => (
              <Link
                key={key}
                href={`/services/${key}`}
                className={`group relative overflow-hidden rounded-[1.75rem] bg-zinc-900 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_40px_70px_-30px_rgba(0,0,0,0.45)] ${
                  idx === 0
                    ? "lg:col-span-2 lg:row-span-2 min-h-[300px] lg:min-h-[420px]"
                    : "lg:col-span-2 min-h-[220px] lg:min-h-[200px]"
                }`}
              >
                {photo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photo}
                    alt={meta.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5" />

                {/* Badges — meaningful because only two cards carry one */}
                {idx === 0 && (
                  <span className="absolute top-4 left-4 z-10 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Flame size={11} strokeWidth={2.5} /> #1 in {location?.city || "your area"}
                  </span>
                )}
                {idx === 1 && (
                  <span className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur text-black text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <TrendingUp size={11} strokeWidth={2.5} /> Trending now
                  </span>
                )}

                <div className={`absolute inset-x-0 bottom-0 z-10 p-5 ${idx === 0 ? "md:p-7" : ""}`}>
                  <div className="flex items-center gap-2 mb-2.5 text-[10px] font-bold text-white/70">
                    <span className="flex items-center gap-1 text-emerald-300">
                      <Clock size={11} strokeWidth={2.5} /> {ins.eta}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/25" />
                    <span className="flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> {ins.rating}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/25" />
                    <span>{ins.booked} booked</span>
                  </div>

                  <h3 className={`text-white font-black tracking-tight leading-none ${idx === 0 ? "text-2xl md:text-4xl" : "text-xl md:text-2xl"}`}>
                    {meta.label}
                  </h3>
                  <p className="text-white/60 text-xs font-semibold mt-1.5 truncate">
                    {popular ? popular.name : meta.description} · {count} services
                  </p>

                  <div className="flex items-center justify-between gap-3 mt-4">
                    <p className="text-white font-black tracking-tight">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 mr-1.5">From</span>
                      {minPrice != null ? formatPrice(minPrice) : "—"}
                    </p>
                    <span className="inline-flex items-center gap-1.5 bg-white text-black text-[10px] font-black uppercase tracking-wider pl-4 pr-3 py-2.5 rounded-full shadow-lg group-hover:gap-2.5 transition-all duration-300">
                      Explore <ArrowUpRight size={13} strokeWidth={2.75} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Tier 2: everything else, clustered by intent ──────────────
              Each group is a horizontal slider so the row stays on one line
              instead of wrapping, and the heading lets a user jump to their job. */}
          <div className="space-y-12 md:space-y-14 mb-14">
            {CATEGORY_GROUPS.map((group) => {
              const items = group.keys.map(k => catStats[k]).filter(Boolean);
              if (!items.length) return null;
              return (
                <CategoryRow key={group.id} group={group} items={items} />
              );
            })}

            {/* Catch-all so admin-created services outside the four clusters
                stay reachable from the home page. */}
            <Link
              href="/services/other"
              className="group flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-zinc-50 ring-1 ring-zinc-150 hover:ring-zinc-300 hover:bg-white transition-all duration-300"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-white ring-1 ring-zinc-200 flex items-center justify-center shrink-0 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                  <Wrench size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-zinc-900 tracking-tight">Can&rsquo;t find your service?</span>
                  <span className="block text-xs text-zinc-400 truncate">
                    Tell us the job and we&rsquo;ll match you with a verified pro
                  </span>
                </span>
              </span>
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                Browse all
                <ArrowUpRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </Link>
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
              <div
                className="md:col-span-5 lg:col-span-5 border border-zinc-800 rounded-2xl h-[280px] relative overflow-hidden flex items-center justify-center p-4 group transition-colors duration-500"
                style={{
                  backgroundColor: DIAGNOSTICS_DATA[diagTab]?.bg || "#18181b",
                  boxShadow: `inset 0 0 70px 26px ${DIAGNOSTICS_DATA[diagTab]?.bg || "#18181b"}`,
                }}
              >
                {/* Dark diagonal stripe back-hatch */}
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "12px 12px" }} />

                {/* Live status dot */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Live Scan</span>
                </div>

                {/* Appliance image with interactive diagnostic hotspots */}
                <div className="relative w-full h-full">
                  {Object.entries(DIAGNOSTICS_DATA).map(([key, data]) => {
                    const isActiveTab = diagTab === key;
                    return (
                      <div
                        key={key}
                        className={`absolute inset-0 transition-all duration-500 ${isActiveTab ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                      >
                        <Image
                          src={data.image}
                          alt={`${data.name} diagnostic view`}
                          fill
                          sizes="(max-width: 768px) 100vw, 40vw"
                          className="object-contain transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Diagnostic hotspots overlaid on the appliance */}
                        {data.symptoms.map(s => {
                          const isActive = selectedSymptom?.id === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelectedSymptom(s)}
                              aria-label={s.issue}
                              style={{ left: s.hotspot.x, top: s.hotspot.y }}
                              className={`absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 ${isActive ? "scale-125" : "hover:scale-110"}`}
                            >
                              <span className={`absolute inset-0 rounded-full opacity-60 border animate-ping ${data.pulseColor}`} />
                              <span className={`w-3.5 h-3.5 rounded-full border border-white shadow-md flex items-center justify-center text-[7px] font-black text-white transition-colors ${isActive ? "bg-white text-zinc-950" : "bg-black"}`}>
                                !
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
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

      {/* ── GLOBAL & PAN-INDIA NETWORK ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#C8A45C]/[0.08] blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/[0.05] blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 md:px-10 relative z-10">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#C8A45C] mb-3">
              GLOBAL & PAN-INDIA NETWORK
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Engineered in India, <span className="text-[#C8A45C]">Serving Worldwide</span>
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Founded & developed by Gautam Pandit in New Delhi. Connecting background-verified home service professionals across 35+ Indian cities (Delhi, Jharkhand, Kolkata, Mumbai, Bengaluru) and expanding to global hubs.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black p-2 md:p-4 shadow-[0_0_80px_-20px_rgba(200,164,92,0.18)]">
            <WorldMap
              theme="dark"
              lineColor="#C8A45C"
              dots={[
                // Headquarters & PAN-India Hubs
                {
                  start: { lat: 28.6139, lng: 77.209, label: "New Delhi (HQ)", offset: { x: 0, y: -24 } },
                  end: { lat: 23.3441, lng: 85.3096, label: "Jharkhand (India)", offset: { x: 40, y: 16 } },
                },
                {
                  start: { lat: 28.6139, lng: 77.209, label: "New Delhi (HQ)" },
                  end: { lat: 19.076, lng: 72.8777, label: "Mumbai (India)", offset: { x: -40, y: 16 } },
                },
                // Middle East & Africa
                {
                  start: { lat: 28.6139, lng: 77.209, label: "New Delhi (HQ)" },
                  end: { lat: 25.2048, lng: 55.2708, label: "Dubai", offset: { x: -35, y: -10 } },
                },
                {
                  start: { lat: 25.2048, lng: 55.2708, label: "Dubai" },
                  end: { lat: 30.0444, lng: 31.2357, label: "Cairo", offset: { x: -25, y: -10 } },
                },
                {
                  start: { lat: 30.0444, lng: 31.2357, label: "Cairo" },
                  end: { lat: -33.9249, lng: 18.4241, label: "Cape Town", offset: { x: 0, y: 18 } },
                },
                // Europe & Americas
                {
                  start: { lat: 28.6139, lng: 77.209, label: "New Delhi (HQ)" },
                  end: { lat: 51.5074, lng: -0.1278, label: "London", offset: { x: 0, y: -18 } },
                },
                {
                  start: { lat: 51.5074, lng: -0.1278, label: "London" },
                  end: { lat: 48.8566, lng: 2.3522, label: "Paris", offset: { x: 28, y: 15 } },
                },
                {
                  start: { lat: 51.5074, lng: -0.1278, label: "London" },
                  end: { lat: 40.7128, lng: -74.006, label: "New York", offset: { x: 0, y: -18 } },
                },
                {
                  start: { lat: 40.7128, lng: -74.006, label: "New York" },
                  end: { lat: 37.7749, lng: -122.4194, label: "San Francisco", offset: { x: -10, y: 18 } },
                },
                {
                  start: { lat: 40.7128, lng: -74.006, label: "New York" },
                  end: { lat: -23.5505, lng: -46.6333, label: "São Paulo", offset: { x: 0, y: 18 } },
                },
                // East Asia & Australia
                {
                  start: { lat: 28.6139, lng: 77.209, label: "New Delhi (HQ)" },
                  end: { lat: 1.3521, lng: 103.8198, label: "Singapore", offset: { x: 0, y: 18 } },
                },
                {
                  start: { lat: 1.3521, lng: 103.8198, label: "Singapore" },
                  end: { lat: 35.6762, lng: 139.6503, label: "Tokyo", offset: { x: 20, y: -15 } },
                },
                {
                  start: { lat: 1.3521, lng: 103.8198, label: "Singapore" },
                  end: { lat: -33.8688, lng: 151.2093, label: "Sydney", offset: { x: 0, y: 18 } },
                },
              ]}
            />
          </div>

          <div className="mt-10 grid grid-cols-3 gap-px bg-white/[0.06] max-w-3xl mx-auto rounded-xl overflow-hidden border border-white/10">
            {[
              { value: "35+", label: "Cities & Hubs" },
              { value: "2,000+", label: "Verified Pros" },
              { value: "12,450+", label: "Jobs Completed" },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-950 py-6 px-4 text-center">
                <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C8A45C]">
                  {stat.label}
                </p>
              </div>
            ))}
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

          {/* Auto-sliding reviews carousel */}
          <div
            className="relative max-w-3xl mx-auto mb-4"
            onMouseEnter={() => setReviewPaused(true)}
            onMouseLeave={() => setReviewPaused(false)}
          >
            {/* Sliding viewport */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {reviews.map((t, idx) => (
                  <div key={idx} className="w-full shrink-0 px-1">
                    <article className="relative bg-white border border-zinc-150 p-8 md:p-12 rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.12)] flex flex-col min-h-[300px]">
                      <Quote className="absolute top-8 right-9 text-zinc-100" size={60} strokeWidth={1.5} />

                      <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-2 mb-6">
                          <Stars n={t.rating} size={15} />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                          <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Verified Purchase</span>
                        </div>
                        <p className="text-lg md:text-2xl font-medium text-zinc-800 leading-relaxed tracking-tight">
                          &ldquo;{t.text}&rdquo;
                        </p>
                      </div>

                      <div className="mt-8 pt-7 border-t border-zinc-100 flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 text-white flex items-center justify-center text-sm font-black shadow-md shrink-0">
                          {t.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-black truncate">{t.name}</p>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                            <span>{t.city}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className="text-emerald-500">Verified</span>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{t.service}</p>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls: prev / dots / next */}
            <div className="flex items-center justify-center gap-6 mt-9">
              <button
                onClick={goPrevReview}
                aria-label="Previous review"
                className="w-11 h-11 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-black hover:text-white hover:border-black transition-all active:scale-95"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>

              <div className="flex items-center gap-2">
                {reviews.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReviewSlide(idx)}
                    aria-label={`Go to review ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === activeSlide ? "w-7 bg-black" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`}
                  />
                ))}
              </div>

              <button
                onClick={goNextReview}
                aria-label="Next review"
                className="w-11 h-11 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-black hover:text-white hover:border-black transition-all active:scale-95"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
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
                Join 2,000+ verified professionals already earning through EliteCrew. Flexible hours, instant job alerts, and weekly direct payouts.
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

              <Link href="/register"
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
              <div className="flex max-w-sm mb-7 border border-zinc-200 bg-white focus-within:border-black transition-colors rounded-xl overflow-hidden">
                <span className="flex items-center pl-4 text-zinc-400 shrink-0">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") runExplore(citySearch); }}
                  placeholder="Search any city, town or district…"
                  className="flex-1 px-3 py-3.5 text-sm font-medium text-black placeholder:text-zinc-400 bg-transparent outline-none"
                />
                <button
                  onClick={() => runExplore(citySearch)}
                  className="bg-black text-white px-5 text-[10px] font-black tracking-widest uppercase hover:bg-zinc-800 transition-colors shrink-0"
                >
                  Find
                </button>
              </div>

              {/* Popular place chips */}
              <div className="flex flex-wrap gap-2">
                {POPULAR_PLACES.map(city => {
                  const active = placeLabel.toLowerCase() === city.toLowerCase();
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => runExplore(city)}
                      className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase border rounded-full transition-all ${
                        active
                          ? "bg-black text-white border-black"
                          : "bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black"
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
                <span className="px-4 py-2 bg-zinc-50 border border-dashed border-zinc-200 text-[10px] font-black tracking-widest uppercase text-zinc-400 rounded-full select-none">
                  + Anywhere
                </span>
              </div>

              {/* Now-showing pill */}
              <div className="mt-6 flex items-center gap-3 py-3 px-4 border border-zinc-100 bg-zinc-50 max-w-sm rounded-xl">
                <span className={`w-2 h-2 rounded-full shrink-0 ${explore.loading ? "bg-amber-400 animate-pulse" : explore.error ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                    {explore.loading ? "Locating…" : explore.error ? "Lookup failed" : "Now exploring"}
                  </p>
                  <p className="text-sm font-extrabold text-black truncate">
                    {placeLabel}
                    {explore.place?.country && (
                      <span className="font-medium text-zinc-400 ml-1.5">· {explore.place.country}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right: live place explorer grid ── */}
            <div className="relative">
              <div className="absolute -inset-3 bg-zinc-100 rounded-[1.5rem] -rotate-1 pointer-events-none" />

              <div className="relative grid grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden shadow-2xl shadow-zinc-300/60 h-[440px]">

                {/* Two featured spot images */}
                <SpotTile
                  key={`tile0-${imageSpots[0]?.image || placeLabel}`}
                  loading={explore.loading}
                  image={imageSpots[0]?.image}
                  name={imageSpots[0]?.name}
                  category={imageSpots[0]?.category}
                  placeLabel={placeLabel}
                  gradient={TILE_GRADIENTS[0]}
                />
                <SpotTile
                  key={`tile1-${imageSpots[1]?.image || placeLabel}`}
                  loading={explore.loading}
                  image={imageSpots[1]?.image}
                  name={imageSpots[1]?.name}
                  category={imageSpots[1]?.category}
                  placeLabel={placeLabel}
                  gradient={TILE_GRADIENTS[1]}
                />

                {/* City guide */}
                <div className="relative bg-zinc-950 p-5 flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px,#fff 1px,transparent 0)", backgroundSize: "14px 14px" }} />
                  <div className="relative">
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">
                      Place Guide
                    </p>
                    <p className="text-xl font-extrabold text-white leading-tight truncate">{placeLabel}</p>
                    <p className="text-sm text-zinc-400 mt-0.5 font-medium">
                      {explore.place?.country || "Famous nearby spots"}
                    </p>
                  </div>
                  <div className="relative space-y-2 mt-3">
                    {explore.loading ? (
                      [0, 1, 2].map(i => <div key={i} className="h-3 bg-white/10 rounded animate-pulse" style={{ width: `${70 - i * 12}%` }} />)
                    ) : guideSpots.length > 0 ? (
                      guideSpots.map((s, i) => (
                        <div key={`${s.name}-${i}`} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-[11px] text-zinc-400 font-medium truncate">{s.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        We&apos;re mapping this area — service is still available here.
                      </p>
                    )}
                  </div>
                </div>

                {/* Book panel */}
                <div className="bg-black p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-3">
                      Available in {placeLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {["AC", "Fridge", "Fan", "TV", "Electrical", "Cooler"].map(s => (
                        <span key={s}
                          className="px-2 py-1 text-[9px] font-bold uppercase tracking-wide border border-white/10 text-white/40 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/services/ac"
                    className="flex items-center gap-1.5 mt-4 text-[10px] font-bold tracking-widest uppercase text-white hover:text-zinc-300 transition-colors group"
                  >
                    Book in {placeLabel}
                    <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
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
            Join 50,000+ customers who trust EliteCrew for fast, reliable, and transparently-priced home services.
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
      <SiteFooter />

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
