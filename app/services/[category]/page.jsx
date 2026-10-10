"use client";

import Link from "next/link";
import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_META, SERVICE_CATALOG, formatPrice } from "@/lib/services";
import SmartSearch from "@/components/SmartSearch";
import api from "@/lib/api";
import BrandLoader from "@/components/BrandLoader";
import { 
  ArrowLeft, Clock, Check, ArrowRight, Sparkles, 
  ChevronRight, ChevronLeft, Shield, Star, Award, Zap, HelpCircle 
} from "lucide-react";

const SERVICE_IMAGES = {
  // AC
  "ac-repair": "/images/ac_repair.png",
  "ac-installation": "/images/ac_installation.png",
  "ac-deep-cleaning": "/images/ac_deep_cleaning.png",
  "ac-gas-refilling": "/images/ac_gas_refilling.png",
  "ac-uninstallation": "/images/ac_uninstallation.png",
  
  // Cooler
  "cooler-repair": "/images/cooler_repair.png",
  "cooler-service": "/images/cooler_service.png",
  "cooler-installation": "/images/cooler_installation.png",
  
  // Fan
  "fan-repair": "/images/fan_repair.png",
  "fan-installation": "/images/fan_installation.png",
  "fan-servicing": "/images/fan_servicing.png",
  
  // TV
  "tv-repair": "/images/tv_repair.png",
  "tv-wall-mounting": "/images/tv_wall_mounting.png",
  
  // Fridge
  "fridge-repair": "/images/fridge_repair.png",
  "fridge-gas-refill": "/images/fridge_gas_refill.png",
  
  // Electrical
  "electrical-work": "/images/electrical_work.png",
  "wiring-cabling": "/images/wiring_cabling.png",
  
  // Appliances
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

const CATEGORY_BACKGROUNDS = {
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

const DEFAULT_SERVICE_IMAGE = "/images/default_service.png";

// "What's the problem?" finder: symptom -> service slug (slugs live in lib/services.js)
const FINDER_DATA = {
  ac: [
    { q: "AC is on but not cooling properly", slug: "ac-repair",         why: "Cooling problems need a proper check first. Our pro inspects gas pressure, coils and the compressor as part of the visit." },
    { q: "Bad smell or dust from the vents",  slug: "ac-deep-cleaning",  why: "Dirty filters and coils are the usual cause. A deep clean removes the dust, bacteria and smell." },
    { q: "Water dripping from the indoor unit", slug: "ac-deep-cleaning", why: "A choked drain tray makes the unit drip. Deep cleaning includes a full drain flush." },
    { q: "Ice on the pipes or gas leak",      slug: "ac-gas-refilling",  why: "Frosting and warm air point to low refrigerant. The pro finds the leak and refills the gas." },
    { q: "I bought a new AC",                 slug: "ac-installation",   why: "Wall mounting, copper piping and electrical connection, finished with a demo." },
    { q: "Shifting house, need AC removed",   slug: "ac-uninstallation", why: "Safe dismounting with gas recovery and pipe capping, ready to move." },
  ],
  cooler: [
    { q: "Cooler isn't cooling or smells musty", slug: "cooler-service",      why: "Scaled pads and a dirty tank cause weak cooling. Full service cleans everything and overhauls the pump." },
    { q: "Motor hums, fan won't spin, or no water", slug: "cooler-repair",   why: "The pro checks the motor, pump and wiring and fixes the fault on the spot." },
    { q: "New cooler to set up",              slug: "cooler-installation", why: "Placement, water connection and electrical setup with a test run." },
  ],
  fan: [
    { q: "Fan spins slowly",                  slug: "fan-repair",       why: "A weak capacitor is the most common cause. It gets checked and replaced if needed." },
    { q: "Fan won't start or hums",           slug: "fan-repair",       why: "Winding and capacitor inspection finds out whether it's a quick fix." },
    { q: "Wobbling, noisy or very dusty",     slug: "fan-servicing",    why: "Cleaning, blade balancing and bearing lubrication bring back smooth, quiet running." },
    { q: "New fan to fit",                    slug: "fan-installation", why: "Ceiling or wall mounting with wiring, blade balancing and a test." },
  ],
  tv: [
    { q: "No display, lines or flicker",      slug: "tv-repair",        why: "Backlight and panel faults need a diagnosis. The pro inspects the boards and repairs what's possible." },
    { q: "TV won't switch on",                slug: "tv-repair",        why: "Power and main-board checks come first, followed by a basic repair." },
    { q: "Want it mounted on the wall",       slug: "tv-wall-mounting", why: "Bracket installation, tidy cables and level alignment, with a safety check." },
  ],
  fridge: [
    { q: "Fridge isn't cooling enough",       slug: "fridge-repair",     why: "Cooling diagnosis covers the compressor and thermostat, followed by a basic repair." },
    { q: "Strange noise or frequent clicking", slug: "fridge-repair",    why: "The compressor and its relay are inspected to find the source of the noise." },
    { q: "Heavy ice build-up or gas leak",    slug: "fridge-gas-refill", why: "Leak check, gas refill and pressure testing, then a cooling test." },
  ],
  electrical: [
    { q: "Switch or socket sparking, loose or dead", slug: "electrical-work", why: "Switch and socket repair with a wiring and safety check on the same visit." },
    { q: "MCB keeps tripping",                slug: "electrical-work",  why: "Tripping points to overload or a short. The pro inspects the MCB and circuit." },
    { q: "New or old wiring needs replacing", slug: "wiring-cabling",   why: "New wiring, cable routing and junction boxes, fully tested." },
  ],
  appliance: [
    { q: "Washing machine shaking, not draining or not spinning", slug: "washing-machine-repair", why: "Motor, drum, belt and pump are checked, then a test run." },
    { q: "Geyser, microwave or another appliance is faulty",      slug: "appliance-repair",       why: "General diagnosis and component check, with a basic repair." },
  ],
  plumbing: [
    { q: "Tap or mixer is leaking",           slug: "tap-mixer-repair",    why: "Washer, cartridge and mixer repair or replacement." },
    { q: "Toilet flush not working or running", slug: "toilet-flush-repair", why: "Flush tank and mechanism repair." },
    { q: "Sink or drain is blocked",          slug: "drain-unclogging",    why: "Unclogging of sinks, floor drains and pipes." },
    { q: "Leaking pipe or damp wall",         slug: "pipe-leakage-repair", why: "Leak is traced and the pipe repaired." },
    { q: "Water tank is dirty",               slug: "water-tank-cleaning", why: "Full tank cleaning so the water in your taps is clean." },
  ],
  cleaning: [
    { q: "Stained bathroom, limescale",       slug: "bathroom-deep-cleaning",  why: "Deep scrub of tiles, fittings and floor." },
    { q: "Greasy kitchen",                    slug: "kitchen-deep-cleaning",   why: "Chimney, hob, cabinets and tiles degreased." },
    { q: "Whole house before a festival or move-in", slug: "full-home-deep-cleaning", why: "Every room covered in one booking." },
    { q: "Dirty sofa",                        slug: "sofa-shampoo-cleaning",   why: "Shampoo cleaning that lifts stains and dust." },
    { q: "Mattress or carpet needs cleaning", slug: "mattress-cleaning",       why: "Deep cleaning for dust, mites and stains." },
  ],
};

function ServiceFinder({ category, services, onBook, onViewCard }) {
  const options = (FINDER_DATA[category] || [])
    .map(o => ({ ...o, svc: services.find(sv => sv.slug === o.slug) }))
    .filter(o => o.svc);
  const [idx, setIdx] = useState(0);
  if (options.length === 0) return null;

  const cur = options[Math.min(idx, options.length - 1)];
  const svc = cur.svc;
  const includes = (svc.includes || []).slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 pb-6">
      <div className="mb-5">
        <p className="text-[11px] font-semibold tracking-wide text-emerald-600 mb-1">Not sure what to book?</p>
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-900">What&rsquo;s the problem?</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
        {/* Symptoms */}
        <div className="md:col-span-5 rounded-3xl bg-white border border-zinc-200 p-2.5 flex flex-col gap-1">
          {options.map((o, i) => {
            const on = i === idx;
            return (
              <button
                key={o.q}
                type="button"
                onClick={() => setIdx(i)}
                className={`flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 text-[13.5px] font-medium cursor-pointer transition-colors ${on ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
              >
                <span className={`flex w-[18px] h-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-emerald-400" : "border-zinc-300"}`}>
                  {on && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </span>
                {o.q}
              </button>
            );
          })}
        </div>

        {/* Recommendation */}
        <div key={cur.q} className="md:col-span-7 rounded-3xl bg-zinc-950 text-white p-5 md:p-7 flex flex-col relative overflow-hidden animate-reveal-up">
          <div className="pointer-events-none absolute -right-20 -top-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-[90px]" />
          <p className="relative text-[11px] font-semibold tracking-wide text-emerald-400 mb-2">We recommend</p>
          <h3 className="relative text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">{svc.name}</h3>
          <p className="relative text-sm text-zinc-400 leading-relaxed mt-2 max-w-lg">{cur.why}</p>

          {includes.length > 0 && (
            <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-5">
              {includes.map(item => (
                <li key={item} className="flex items-center gap-2 text-[13px] text-zinc-200">
                  <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
          )}

          <div className="relative mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div>
              <p className="text-[11px] text-zinc-500 font-medium">Starts at</p>
              <p className="text-2xl font-extrabold leading-none mt-0.5">{formatPrice(svc.price)}
                <span className="text-xs font-medium text-zinc-500 ml-1.5">{String(svc.unit || "per_visit").replace("_", " ")} · {svc.duration}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={() => onViewCard(svc.slug)}
                className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                View details
              </button>
              <button
                type="button"
                onClick={() => onBook(svc.slug)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-300 transition-colors cursor-pointer"
              >
                Book now <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-medium text-zinc-400">
            {["Free diagnosis on every visit", "Pay after the job is done", "Background-verified pros"].map(t => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check size={12} className="text-emerald-400" strokeWidth={3} /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


const CATEGORY_FAQS = [
  { q: "What is covered in the 30-Day Free Warranty?", a: "If the same fault reoccurs within 30 days of our service, we dispatch a senior expert for free inspection and repairs, zero additional charge." },
  { q: "Are the service professionals background verified?", a: "Yes, 100%. Every single technician undergoes third-party background checks, criminal record verification, and a strict 3-stage practical testing program before joining." },
  { q: "How is accidental damage handled?", a: "We provide an ultimate platform safety insurance guarantee of up to ₹10,000 to cover any accidental damages to home electronics during our service." },
  { q: "Can I easily reschedule or cancel my booking?", a: "Absolutely. Rescheduling or cancelling is completely free and can be done instantly with a single click in your dashboard up to 3 hours before the scheduled time slot." }
];

function CategoryTabs({ active }) {
  const scroller = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: true });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdge({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    // keep the active tab in view
    el.querySelector('[data-active="true"]')?.scrollIntoView({ inline: "center", block: "nearest" });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, active]);

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 -translate-y-1/2 z-10 hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-700 cursor-pointer hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 relative">
      {edge.left && (
        <>
          <div className="pointer-events-none absolute left-6 md:left-10 top-0 h-full w-14 bg-gradient-to-r from-white to-transparent z-[5]" />
          <button type="button" aria-label="Scroll tabs left" onClick={() => scrollBy(-1)} className={`${arrow} left-6 md:left-10`}>
            <ChevronLeft size={16} strokeWidth={2.4} />
          </button>
        </>
      )}
      <div ref={scroller} onScroll={update} className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
        {Object.entries(CATEGORY_META).map(([key, m]) => (
          <Link key={key} href={`/services/${key}`} data-active={key === active} className="shrink-0">
            <span className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer transition-colors ${key === active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"}`}>
              <m.icon size={14} strokeWidth={2} />
              {m.label}
            </span>
          </Link>
        ))}
      </div>
      {edge.right && (
        <>
          <div className="pointer-events-none absolute right-6 md:right-10 top-0 h-full w-14 bg-gradient-to-l from-white to-transparent z-[5]" />
          <button type="button" aria-label="Scroll tabs right" onClick={() => scrollBy(1)} className={`${arrow} right-6 md:right-10`}>
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </>
      )}
    </div>
  );
}

export default function ServiceCategoryPage({ params }) {
  const { category } = use(params);
  const router = useRouter();

  const meta     = CATEGORY_META[category];
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Hooks for Interactive Upgrades
  const [cart, setCart] = useState({});
  const [openFaq, setOpenFaq] = useState(null);
  const [highlightedService, setHighlightedService] = useState(null);

  useEffect(() => {
    let active = true;
    
    const adaptDbService = (dbSvc) => ({
      ...dbSvc,
      slug: dbSvc.slug,
      name: dbSvc.name,
      price: dbSvc.basePrice,
      unit: dbSvc.priceUnit || "per_visit",
      duration: dbSvc.estimatedDurationMinutes ? `${dbSvc.estimatedDurationMinutes} min` : "60 min",
      popular: dbSvc.isPopular || false,
      includes: dbSvc.whatIsIncluded || [],
      images: dbSvc.images || [],
    });

    api.get("/services")
      .then(({ data }) => {
        if (!active) return;
        if (data?.success && data?.services) {
          const filtered = data.services
            .filter((s) => s.category === category && s.active !== false)
            .map(adaptDbService);
          
          const staticPresets = (SERVICE_CATALOG[category] || []).map(s => ({
            ...s,
            estimatedDurationMinutes: s.duration ? (parseInt(s.duration, 10) || 60) : 60,
            basePrice: s.price,
            priceUnit: s.unit,
            whatIsIncluded: s.includes,
            isPopular: s.popular,
            active: true
          }));

          const merged = [...filtered];
          staticPresets.forEach(preset => {
            if (!merged.some(s => s.slug === preset.slug)) {
              merged.push(preset);
            }
          });
          
          setServices(merged);
        } else {
          setServices(SERVICE_CATALOG[category] || []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch live services, using static catalog:", err);
        if (active) setServices(SERVICE_CATALOG[category] || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [category]);

  if (loading) {
    return <BrandLoader />;
  }

  if (!meta || !services) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans">
        <div className="text-center animate-reveal-up">
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs mb-4">Category Not Found</p>
          <Link href="/" className="text-white font-black underline underline-offset-4 hover:text-zinc-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const bgBanner = CATEGORY_BACKGROUNDS[category] || DEFAULT_SERVICE_IMAGE;
  const getSvcDetails = (slug) => {
    return services.find(s => s.slug === slug);
  };

  const updateQty = (slug, amount) => {
    setCart(prev => {
      const current = prev[slug] || 0;
      const next = Math.max(0, current + amount);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[slug];
      } else {
        updated[slug] = next;
      }
      return updated;
    });
  };

  const calculateCartTotal = () => {
    return Object.entries(cart).reduce((total, [slug, qty]) => {
      const s = getSvcDetails(slug);
      return total + (s ? s.price * qty : 0);
    }, 0);
  };

  const formatCartDuration = () => {
    let totalMin = 0;
    Object.entries(cart).forEach(([slug, qty]) => {
      const s = getSvcDetails(slug);
      if (s) {
        let min = 60;
        if (s.duration.includes("hrs") || s.duration.includes("hr")) {
          const matches = s.duration.match(/\d+/g);
          if (matches) {
            const hrs = matches.length > 1 ? (parseFloat(matches[0]) + parseFloat(matches[1])) / 2 : parseFloat(matches[0]);
            min = hrs * 60;
          }
        } else {
          const matches = s.duration.match(/\d+/g);
          if (matches) {
            min = matches.length > 1 ? (parseFloat(matches[0]) + parseFloat(matches[1])) / 2 : parseFloat(matches[0]);
          }
        }
        totalMin += min * qty;
      }
    });
    
    if (totalMin < 60) return `${Math.round(totalMin)} min`;
    const hours = totalMin / 60;
    return `${hours.toFixed(1)} hrs`;
  };

  const handleCheckout = () => {
    const slugs = Object.keys(cart);
    if (slugs.length === 0) return;
    const firstSlug = slugs[0];
    const cartQuery = Object.entries(cart)
      .map(([slug, qty]) => `${slug}:${qty}`)
      .join(",");
    router.push(`/book/${firstSlug}?cart=${cartQuery}`);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-zinc-50/30 font-sans selection:bg-black selection:text-white pb-32">

      {/* Navbar - Premium Glassmorphism */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-150 shadow-[0_1px_15px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-[116px] sm:h-16 flex flex-col justify-center gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black hover:border-black hover:bg-zinc-50 transition-all duration-300 cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <img 
                src="/logo-transparent.png" 
                alt="EliteCrew" 
                className="w-7 h-7 object-contain transition-transform duration-500 group-hover:rotate-[15deg]" 
              />
              <span className="text-base font-black tracking-tight text-black">
                Elite<span className="font-light text-zinc-400">Crew</span>
              </span>
            </Link>
          </div>
          <SmartSearch role="public" compact className="sm:ml-auto w-full sm:flex-1 max-w-md" />
        </div>
      </nav>

      {/* Category header */}
      <div className="bg-zinc-950 px-6 md:px-10 py-6 md:py-8 relative overflow-hidden">
        <img
          src={bgBanner}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-50 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/75 to-zinc-950/10 pointer-events-none" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 w-60 h-60 rounded-full bg-emerald-500/20 blur-[80px]" />

        <div className="max-w-7xl mx-auto relative z-10 flex items-center justify-between gap-6">
          <div>
            <nav className="flex items-center gap-1.5 text-[11px] font-medium text-white/55 mb-2" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-white/30">/</span>
              <span>Services</span>
              <span className="text-white/30">/</span>
              <span className="text-emerald-400">{meta.label}</span>
            </nav>
            <div className="flex items-center gap-3">
              <span className="flex w-9 h-9 rounded-xl bg-emerald-400/15 border border-emerald-400/30 items-center justify-center text-emerald-300 shrink-0">
                <meta.icon size={18} strokeWidth={1.8} />
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-none animate-reveal-up">
                {meta.label}
              </h1>
            </div>
            <p className="text-white/65 text-[13px] md:text-sm mt-2 animate-reveal-up">
              {meta.description}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {["Verified pros", "Pay after service"].map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/90">
                <Check size={12} className="text-emerald-400" strokeWidth={3} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-[116px] sm:top-16 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <CategoryTabs active={category} />
      </div>

      {/* Service Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc, idx) => {
            const imageUrl = (svc.images && svc.images.length > 0)
              ? svc.images[0]
              : (SERVICE_IMAGES[svc.slug] || DEFAULT_SERVICE_IMAGE);
            const qty = cart[svc.slug] || 0;
            const isHighlighted = highlightedService === svc.slug;

            return (
              <div
                key={svc.slug}
                id={`service-${svc.slug}`}
                className={`group bg-white flex flex-col relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isHighlighted
                    ? "border-emerald-500 ring-4 ring-emerald-500/15 shadow-[0_24px_50px_-18px_rgba(16,185,129,0.35)]"
                    : "border-zinc-200 hover:border-zinc-300 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.25)]"
                }`}
                style={{ animationDelay: `${idx * 75}ms` }}
              >
                {/* Image with floating Add button (overlaps the edge) */}
                <div className="relative p-2.5 pb-0">
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={svc.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                    {svc.popular && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-900 shadow-sm">
                        <Sparkles size={11} className="text-amber-500" />
                        Most booked
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 pt-4 pb-0 flex-1 flex flex-col">
                  <h3 className="text-[17px] font-extrabold text-zinc-900 tracking-tight leading-snug">{svc.name}</h3>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[13px] text-zinc-500">Starts at <span className="text-[17px] font-extrabold text-zinc-900 align-baseline">{formatPrice(svc.price)}</span></span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                      <Clock size={12} className="text-zinc-400" />{svc.duration}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 capitalize">
                      {svc.unit.replace("_", " ")}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-zinc-200 mt-4 pt-4 pb-5">
                    <p className="text-[11px] font-semibold text-zinc-400 mb-2.5">What&rsquo;s included</p>
                    <ul className="space-y-2">
                      {svc.includes.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-zinc-700 leading-snug">
                          <Check size={15} strokeWidth={2.6} className="text-emerald-500 mt-px shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {svc.includes.length > 3 && (
                      <details className="group/more mt-2">
                        <summary className="list-none cursor-pointer text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 select-none [&::-webkit-details-marker]:hidden">
                          <span className="group-open/more:hidden">+{svc.includes.length - 3} more included</span>
                          <span className="hidden group-open/more:inline">Show less</span>
                        </summary>
                        <ul className="mt-2 space-y-2">
                          {svc.includes.slice(3).map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[13px] text-zinc-700 leading-snug">
                              <Check size={15} strokeWidth={2.6} className="text-emerald-500 mt-px shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>

                  {/* Footer: trust note + add action on one line */}
                  <div className="mt-auto -mx-5 px-5 py-3 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-800 leading-tight">
                      <Shield size={14} className="text-emerald-600 shrink-0" /> Pay after the job is done
                    </span>
                    {qty === 0 ? (
                      <button
                        onClick={() => updateQty(svc.slug, 1)}
                        className="shrink-0 rounded-lg bg-white border border-emerald-500 px-5 py-1.5 text-[13px] font-bold text-emerald-700 shadow-sm hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="shrink-0 flex items-center rounded-lg bg-emerald-500 text-white overflow-hidden shadow-sm">
                        <button
                          onClick={() => updateQty(svc.slug, -1)}
                          className="w-8 h-8 flex items-center justify-center text-base font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-5 text-center text-[13px] font-bold">{qty}</span>
                        <button
                          onClick={() => updateQty(svc.slug, 1)}
                          className="w-8 h-8 flex items-center justify-center text-base font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help me choose: after the listing, for people still unsure */}
      <ServiceFinder
        category={category}
        services={services}
        onBook={(slug) => router.push(`/book/${slug}?cart=${slug}:1`)}
        onViewCard={(slug) => {
          const card = document.getElementById(`service-${slug}`);
          if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedService(slug);
            setTimeout(() => setHighlightedService(null), 3000);
          }
        }}
      />

      {/* Premium Trust Badges */}
      <div className="border-y border-zinc-150 bg-zinc-50/50 backdrop-blur-sm px-6 md:px-10 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Shield, title: "100% Insured", desc: "Up to ₹10,000 damage coverage on electronics" },
            { icon: Star, title: "4.8★ Rated Pros", desc: "Rigorous background checked & trained specialists" },
            { icon: Award, title: "30-Day Warranty", desc: "No-questions-asked free re-work assurance" },
            { icon: Zap, title: "Zero Hidden Fees", desc: "Pay securely after your job is fully complete" }
          ].map((badge, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mb-3 text-black shadow-sm">
                <badge.icon size={20} strokeWidth={2.2} className="text-zinc-800" />
              </div>
              <h4 className="text-xs font-black tracking-tight text-zinc-950 uppercase mb-1">{badge.title}</h4>
              <p className="text-[10px] text-zinc-500 max-w-[170px] leading-snug">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expanding Accordion FAQs */}
      <div className="max-w-3xl mx-auto py-16 px-6">
        <div className="text-center mb-10">
          <p className="text-[10px] font-black tracking-widest uppercase text-zinc-400 mb-2">Got Questions?</p>
          <h2 className="text-2xl font-black text-black tracking-tight font-sans">Platform Warranties & Service Policies</h2>
        </div>
        <div className="space-y-4">
          {CATEGORY_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-white border border-zinc-180 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:border-zinc-300">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                >
                  <span className="text-xs font-black tracking-tight text-zinc-900">{faq.q}</span>
                  <span className={`text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-90 text-black" : ""}`}>
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </span>
                </button>
                <div className={`transition-all duration-500 overflow-hidden ${isOpen ? "max-h-40 border-t border-zinc-100" : "max-h-0"}`}>
                  <p className="px-6 py-5 text-xs text-zinc-500 leading-relaxed bg-zinc-50/40">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Help Segment */}
      <div className="border-t border-zinc-150 bg-zinc-50/50 px-6 md:px-10 py-16 text-center">
        <p className="text-zinc-500 text-sm mb-3">Not sure which service fits your requirements?</p>
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-black hover:underline underline-offset-4 transition-all">
          ← Back to All Categories
        </Link>
      </div>

      {/* Sticky Bottom Multi-Unit Floating Checkout Drawer */}
      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pb-safe animate-reveal-up">
          <div className="dark-glass-premium text-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] p-5.5 flex items-center justify-between gap-5 border border-white/10">
            <div>
              <p className="text-[9px] font-black tracking-widest uppercase text-zinc-400">
                {Object.values(cart).reduce((a, b) => a + b, 0)} Units Added • {formatCartDuration()} Est
              </p>
              <p className="text-2xl font-black text-white mt-0.5 leading-none">
                {formatPrice(calculateCartTotal())}
              </p>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="bg-white text-zinc-950 hover:bg-zinc-200 transition-all duration-300 px-6.5 py-4 text-[10px] font-black tracking-widest uppercase rounded-2xl flex items-center gap-2.5 cursor-pointer shadow-lg active:scale-[0.98]"
            >
              <span>Book Appointment</span>
              <ArrowRight size={12} strokeWidth={3} className="text-zinc-950" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

