"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_META, SERVICE_CATALOG, formatPrice } from "@/lib/services";
import SmartSearch from "@/components/SmartSearch";
import { 
  ArrowLeft, Clock, Check, ArrowRight, Sparkles, 
  ChevronRight, Shield, Star, Award, Zap, HelpCircle 
} from "lucide-react";

const SERVICE_IMAGES = {
  // AC
  "ac-repair": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
  "ac-installation": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80",
  "ac-deep-cleaning": "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80",
  "ac-gas-refilling": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
  "ac-uninstallation": "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80",
  
  // Cooler
  "cooler-repair": "https://images.unsplash.com/photo-1618945037805-f1a4dc37688c?auto=format&fit=crop&w=600&q=80",
  "cooler-service": "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80",
  "cooler-installation": "https://images.unsplash.com/photo-1617637455955-eedadea3e83b?auto=format&fit=crop&w=600&q=80",
  
  // Fan
  "fan-repair": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
  "fan-installation": "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=600&q=80",
  "fan-servicing": "https://images.unsplash.com/photo-1544724480-629ee84337f7?auto=format&fit=crop&w=600&q=80",
  
  // TV
  "tv-repair": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80",
  "tv-wall-mounting": "https://images.unsplash.com/photo-1552975084-6e027cd345c2?auto=format&fit=crop&w=600&q=80",
  
  // Fridge
  "fridge-repair": "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80",
  "fridge-gas-refill": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80",
  
  // Electrical
  "electrical-work": "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80",
  "wiring-cabling": "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80",
  
  // Appliances
  "appliance-repair": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
  "washing-machine-repair": "https://images.unsplash.com/photo-1582730147233-ac8112440fd5?auto=format&fit=crop&w=600&q=80",
};

const CATEGORY_BACKGROUNDS = {
  ac:         "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
  cooler:     "https://images.unsplash.com/photo-1618945037805-f1a4dc37688c?auto=format&fit=crop&w=600&q=80",
  fan:        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
  tv:         "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80",
  fridge:     "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80",
  electrical: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80",
  appliance:  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
};

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80";

// Diagnostic Blueprints
const APPLIANCE_BLUEPRINTS = {
  ac: {
    title: "Split AC Blueprint & Diagnostics",
    subtitle: "Identify faults instantly by selecting interactive glowing components",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    hotspots: [
      { id: "coil", name: "Evaporator Coils", x: "32%", y: "45%", desc: "Clogged or dusty evaporator coils decrease heat exchange, causing poor cooling or AC freezing.", service: "ac-repair" },
      { id: "filter", name: "Heavy Air Filter", x: "72%", y: "30%", desc: "Dirty or blocked air filters restrict internal airflow, create foul smells, and hike electrical bills.", service: "ac-deep-cleaning" },
      { id: "blower", name: "Turbine Blower Fan", x: "52%", y: "60%", desc: "Accumulated grime on blower blades creates noisy vibrations or causes low, weak airflow.", service: "ac-deep-cleaning" },
      { id: "compressor", name: "Gas Chamber Valve", x: "18%", y: "82%", desc: "Low gas pressure or refrigerant leaks cause dry running, blowing warm air, or coil frosting.", service: "ac-gas-refilling" }
    ]
  },
  cooler: {
    title: "Desert Cooler Blueprint & Diagnostics",
    subtitle: "Identify faults instantly by selecting interactive glowing components",
    image: "https://images.unsplash.com/photo-1618945037805-f1a4dc37688c?auto=format&fit=crop&w=600&q=80",
    hotspots: [
      { id: "pump", name: "Submersible Pump", x: "28%", y: "78%", desc: "Zero water flow usually means the submersible pump is burnt or clogged with scale.", service: "cooler-repair" },
      { id: "pad", name: "Honeycomb Pads", x: "72%", y: "48%", desc: "Dirty or lime-scaled honeycomb pads block fresh evaporation and block airflow.", service: "cooler-service" },
      { id: "fan", name: "Exhaust Fan Motor", x: "50%", y: "38%", desc: "Exhaust fan motor hums but doesn't spin, or operates at extremely sluggish speeds.", service: "cooler-repair" }
    ]
  },
  fan: {
    title: "Ceiling Fan Blueprint & Diagnostics",
    subtitle: "Identify faults instantly by selecting interactive glowing components",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
    hotspots: [
      { id: "capacitor", name: "Speed Capacitor", x: "50%", y: "22%", desc: "Ceiling fan spinning slowly is 90% caused by a deteriorated or weak speed capacitor.", service: "fan-repair" },
      { id: "winding", name: "Copper Winding Core", x: "50%", y: "45%", desc: "Burnt copper winding or motor stator damages cause complete operational deadness or loud humming.", service: "fan-repair" },
      { id: "blades", name: "Aerodynamic Blades", x: "24%", y: "68%", desc: "Wobbling blades, incorrect pitch, or dirt layer creates high wind noise and reduces cooling.", service: "fan-servicing" }
    ]
  },
  tv: {
    title: "LED TV Anatomy & Diagnostics",
    subtitle: "Identify faults instantly by selecting interactive glowing components",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80",
    hotspots: [
      { id: "panel", name: "IPS LED Panel", x: "50%", y: "45%", desc: "Lines on screen, flickering display, or dark patches are caused by internal backlighting errors.", service: "tv-repair" },
      { id: "board", name: "Power Motherboard", x: "82%", y: "35%", desc: "TV not powering on at all or failing to detect HDMI sources indicates board-level voltage failure.", service: "tv-repair" },
      { id: "mount", name: "Wall Mount Bracket", x: "50%", y: "78%", desc: "Ditch weak brackets. Fit heavy duty steel mount plate with perfect horizontal level alignment.", service: "tv-wall-mounting" }
    ]
  },
  fridge: {
    title: "Inverter Fridge Blueprint & Diagnostics",
    subtitle: "Identify faults instantly by selecting interactive glowing components",
    image: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80",
    hotspots: [
      { id: "coil", name: "Cooling Evaporator", x: "50%", y: "28%", desc: "Frost buildup on coils or fan freeze stops cool air from circulating to the lower cabinets.", service: "fridge-repair" },
      { id: "thermostat", name: "Thermostat Controller", x: "78%", y: "42%", desc: "Faulty temperature sensor dial prevents the compressor from kicking off or cooling correctly.", service: "fridge-repair" },
      { id: "compressor", name: "Rotary Inverter Compressor", x: "32%", y: "84%", desc: "Frequent clicking sounds, zero cooling, or refrigerant gas leaks require high-precision diagnostics.", service: "fridge-gas-refill" }
    ]
  },
  electrical: {
    title: "MCB Distribution Board & Diagnostics",
    subtitle: "Identify faults instantly by selecting interactive glowing components",
    image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80",
    hotspots: [
      { id: "mcb", name: "MCB Breaker Switch", x: "42%", y: "32%", desc: "Frequent circuit breaker tripping is a classic sign of short-circuit faults or circuit overloading.", service: "electrical-work" },
      { id: "socket", name: "Modular Plug Sockets", x: "76%", y: "62%", desc: "Sparking switches or loose, burnt contact terminals behind sockets are severe fire hazards.", service: "electrical-work" },
      { id: "wiring", name: "Heavy Copper Cabling", x: "28%", y: "76%", desc: "Deteriorated insulation, burnt aluminum wiring, or old cables require replacement with FR copper wires.", service: "wiring-cabling" }
    ]
  },
  appliance: {
    title: "Washing Machine Blueprint & Diagnostics",
    subtitle: "Identify faults instantly by selecting interactive glowing components",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    hotspots: [
      { id: "drum", name: "Stainless Steel Tub", x: "50%", y: "42%", desc: "Loud rattling or heavy shaking during spin cycles indicates bearing damage or shock absorber failures.", service: "washing-machine-repair" },
      { id: "motor", name: "Direct Drive Motor", x: "50%", y: "78%", desc: "Drum refuses to rotate despite electrical panel sounding active is 90% a motor or belt issue.", service: "washing-machine-repair" },
      { id: "pump", name: "Drain Filter Pump", x: "82%", y: "86%", desc: "Water standing inside the tub after wash cycles is caused by a blocked drain impeller or pump failure.", service: "appliance-repair" }
    ]
  }
};

// Before / After Comparisons
const BEFORE_AFTER_DATA = {
  ac: {
    before: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    after: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80",
    title: "AC Coil Deep Cleaning Proof",
    desc: "Clogged, dusty coils block thermal exchange. Our jet pump wash strips away dust, mold, and odor-causing bacteria instantly."
  },
  cooler: {
    before: "https://images.unsplash.com/photo-1618945037805-f1a4dc37688c?auto=format&fit=crop&w=600&q=80",
    after: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80",
    title: "Honeycomb Cooling Pad Renewal",
    desc: "Salinized, brittle honeycomb pads ruin cooling output. Drag to see the incredible transformation with high-density fresh pads."
  },
  fan: {
    before: "https://images.unsplash.com/photo-1544724480-629ee84337f7?auto=format&fit=crop&w=600&q=80",
    after: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
    title: "Greasy Fan Blade De-griming",
    desc: "Heavy grease and soot create aerodynamical drag and wobble ceiling fans. We fully dismantle, chemical-wash, and grease bearings."
  },
  tv: {
    before: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80",
    after: "https://images.unsplash.com/photo-1552975084-6e027cd345c2?auto=format&fit=crop&w=600&q=80",
    title: "TV Flush Wall-Mounting Magic",
    desc: "Messy cords and risky shelves ruin premium room vibes. Drag to compare a cluttered setup with perfectly anchored flush wall mounting."
  },
  fridge: {
    before: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80",
    after: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80",
    title: "Coil Defrosting & Seal Refresh",
    desc: "Thick ice accumulation raises compressor workload by 40%. We defrost, clean tubes, and sanitize door gaskets completely."
  },
  electrical: {
    before: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80",
    after: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80",
    title: "Breaker Board Cable Organizing",
    desc: "Cluttered bird's-nest fuse wiring is a severe short-circuit risk. We strip old wires and arrange modular MCB boxes with safety insulation."
  },
  appliance: {
    before: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    after: "https://images.unsplash.com/photo-1582730147233-ac8112440fd5?auto=format&fit=crop&w=600&q=80",
    title: "Washing Machine Tub Descaling",
    desc: "Scale and detergent mold build up on the outer tub ring, dirtying fresh clothes. See the pristine shine after anti-scale descaling."
  }
};

const CATEGORY_FAQS = [
  { q: "What is covered in the 30-Day Free Warranty?", a: "If the same fault reoccurs within 30 days of our service, we dispatch a senior expert for free inspection and repairs, zero additional charge." },
  { q: "Are the service professionals background verified?", a: "Yes, 100%. Every single technician undergoes third-party background checks, criminal record verification, and a strict 3-stage practical testing program before joining." },
  { q: "How is accidental damage handled?", a: "We provide an ultimate platform safety insurance guarantee of up to ₹10,000 to cover any accidental damages to home electronics during our service." },
  { q: "Can I easily reschedule or cancel my booking?", a: "Absolutely. Rescheduling or cancelling is completely free and can be done instantly with a single click in your dashboard up to 3 hours before the scheduled time slot." }
];

export default function ServiceCategoryPage({ params }) {
  const { category } = use(params);
  const router = useRouter();

  const meta     = CATEGORY_META[category];
  const services = SERVICE_CATALOG[category];

  // State Hooks for Interactive Upgrades
  const [cart, setCart] = useState({});
  const [activeSpot, setActiveSpot] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [openFaq, setOpenFaq] = useState(null);
  const [highlightedService, setHighlightedService] = useState(null);

  // Initialize active hotspot on load
  useEffect(() => {
    const blueprint = APPLIANCE_BLUEPRINTS[category];
    if (blueprint && blueprint.hotspots.length > 0) {
      setActiveSpot(blueprint.hotspots[0]);
    }
  }, [category]);

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
  const blueprint = APPLIANCE_BLUEPRINTS[category];
  const beforeAfter = BEFORE_AFTER_DATA[category];

  // Cart Helper Functions
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
        <div className="max-w-7xl mx-auto px-6 md:px-10 min-h-16 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
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
                alt="ServiceMarket" 
                className="w-7 h-7 object-contain transition-transform duration-500 group-hover:rotate-[15deg]" 
              />
              <span className="text-base font-black tracking-tight text-black">
                Service<span className="font-light text-zinc-400">Market</span>
              </span>
            </Link>
          </div>
          <SmartSearch role="public" compact className="sm:ml-auto w-full sm:flex-1 max-w-md" />
        </div>
      </nav>

      {/* Category header - Stunning Watermarked Dark Banner */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-6 md:px-10 py-16 relative overflow-hidden">
        {/* Curated background image watermark */}
        <img
          src={bgBanner}
          alt={meta.label}
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter grayscale contrast-125 pointer-events-none"
        />
        {/* Luxury Vignette and Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              {/* Overline pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 border border-white/10 rounded-full mb-4 animate-reveal-up">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black tracking-widest text-white/90 uppercase">Service Category</span>
              </div>
              <h1 className="text-4xl md:text-5.5xl font-black tracking-tighter text-white mb-4 animate-reveal-up leading-[0.9]">
                {meta.label}
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl animate-reveal-up leading-relaxed">
                {meta.description}
              </p>
            </div>
            
            {/* Floating Banner Icon Container */}
            <div className="hidden md:flex w-24 h-24 rounded-3xl bg-white/5 border border-white/10 items-center justify-center text-white/40 hover:scale-105 hover:text-white hover:border-white/20 transition-all duration-500 shadow-2xl animate-reveal-up">
              <meta.icon size={42} strokeWidth={1.2} />
            </div>
          </div>
        </div>
      </div>

      {/* Category Selection Tabs - Modern Silver Pills */}
      <div className="sticky top-[73px] z-40 border-b border-zinc-150 bg-white/95 backdrop-blur-md px-6 md:px-10 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {Object.entries(CATEGORY_META).map(([key, m]) => (
            <Link key={key} href={`/services/${key}`}>
              <span className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-300 rounded-full border whitespace-nowrap cursor-pointer hover:-translate-y-0.5 ${key === category ? "bg-black text-white border-black shadow-[0_5px_15px_rgba(0,0,0,0.15)]" : "bg-white text-zinc-500 border-zinc-200 hover:border-black hover:text-black hover:bg-zinc-50"}`}>
                <m.icon size={13} strokeWidth={2.2} />
                {m.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Interactive Bento Section */}
      {blueprint && beforeAfter && (
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            
            {/* Left Box: Clickable Appliance Hotspot Visualizer (7 cols) */}
            <div className="md:col-span-7 bg-zinc-950 text-white rounded-3xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden min-h-[460px] md:min-h-[500px] border border-zinc-900 bento-grid-bg shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
              {/* Luxury radial gradient highlight */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(52,211,153,0.12),transparent_50%)] pointer-events-none" />
              
              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Interactive Diagnosis</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                  {blueprint.title}
                </h2>
                <p className="text-xs text-zinc-400 mb-6">
                  {blueprint.subtitle}
                </p>
                
                {/* Blueprint Anatomy Visual Area */}
                <div className="relative w-full aspect-[16/10] bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
                  <img 
                    src={blueprint.image} 
                    alt={blueprint.title} 
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-20 filter grayscale invert contrast-150 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none" />
                  
                  {/* Absolute Blinking Hotspots */}
                  {blueprint.hotspots.map(spot => {
                    const isActive = activeSpot?.id === spot.id;
                    return (
                      <button
                        key={spot.id}
                        onClick={() => {
                          setActiveSpot(spot);
                          const card = document.getElementById(`service-${spot.service}`);
                          if (card) {
                            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setHighlightedService(spot.service);
                            setTimeout(() => setHighlightedService(null), 3000);
                          }
                        }}
                        style={{ left: spot.x, top: spot.y }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 flex items-center justify-center w-8 h-8 rounded-full cursor-pointer focus:outline-none"
                      >
                        <span className={`absolute inset-0 rounded-full transition-all duration-500 ${isActive ? "bg-emerald-400/40 animate-ping" : "bg-emerald-400/10 group-hover:bg-emerald-400/30"}`} />
                        <span className={`relative w-3.5 h-3.5 rounded-full border border-white transition-all duration-300 ${isActive ? "bg-emerald-450 scale-125 shadow-[0_0_15px_rgba(52,211,153,1)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)] group-hover:scale-110"}`} />
                        
                        <span className="absolute top-9 bg-zinc-900 border border-zinc-800 text-white font-black tracking-widest text-[8px] uppercase px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-xl pointer-events-none">
                          {spot.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic hotspot diagnostics footer card */}
              {activeSpot && (
                <div className="relative z-10 mt-6 bg-white/5 border border-white/10 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur-md animate-reveal-up">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400">Diagnosis Matched</span>
                      <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase">{activeSpot.name}</span>
                    </div>
                    <p className="text-xs text-zinc-350 leading-relaxed max-w-xl">{activeSpot.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      const card = document.getElementById(`service-${activeSpot.service}`);
                      if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setHighlightedService(activeSpot.service);
                        setTimeout(() => setHighlightedService(null), 3000);
                      }
                    }}
                    className="self-start sm:self-center bg-white text-zinc-950 hover:bg-zinc-200 transition-all duration-300 px-4 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase whitespace-nowrap shadow-md cursor-pointer"
                  >
                    View Pricing
                  </button>
                </div>
              )}
            </div>
            
            {/* Right Box: Before / After Draggable Compare Widget (5 cols) */}
            <div className="md:col-span-5 bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.02)] min-h-[420px] sm:min-h-[500px]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  <span className="text-[9px] font-black tracking-widest text-zinc-650 uppercase font-sans">Visual Guarantee</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-black mb-1">
                  {beforeAfter.title}
                </h2>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                  {beforeAfter.desc}
                </p>
                
                {/* Visualizer Compare frame */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-150 shadow-inner group">
                  {/* AFTER (Pristine state image on back) */}
                  <img 
                    src={beforeAfter.after} 
                    alt="After Cleaning State" 
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg shadow-md z-20 select-none">
                    Pristine Clean
                  </div>

                  {/* BEFORE (Dirty state image on left, width controlled by slider percentage) */}
                  <div 
                    className="absolute inset-0 overflow-hidden" 
                    style={{ width: `${sliderPos}%` }}
                  >
                    {/* Simulated dirty styling using rich CSS image filters */}
                    <img 
                      src={beforeAfter.before} 
                      alt="Before Cleaning State" 
                      className="absolute inset-0 w-full h-full object-cover max-w-none filter sepia-[0.3] brightness-70 contrast-125 saturate-[0.7] select-none pointer-events-none"
                      style={{ width: "100%", height: "100%" }}
                    />
                    <div className="absolute top-4 left-4 bg-zinc-950/80 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg shadow-md z-20 select-none">
                      Dirty & Worn
                    </div>
                  </div>

                  {/* Vertical bar divider */}
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize z-20 pointer-events-none shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                    style={{ left: `${sliderPos}%` }}
                  >
                    {/* Central drag knob button */}
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-xl flex items-center justify-center pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 4 4 4m8-8l4 4-4 4" />
                      </svg>
                    </div>
                  </div>

                  {/* Transparent overlay input range for simple native accessibility & desktop/mobile dragging */}
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={sliderPos} 
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
                    aria-label="Before / After Compare Slider"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[9px] text-zinc-450 font-black tracking-widest uppercase">
                <span>← Swipe slider left-right to review →</span>
                <span className="text-black font-black">{Math.round(sliderPos)}% Dirty</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Service Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="flex items-center gap-3 mb-10 animate-reveal-up">
          <span className="w-8 h-px bg-zinc-300" />
          <p className="text-[10px] font-black tracking-widest uppercase text-zinc-400">
            {services.length} Premium Service{services.length !== 1 ? "s" : ""} Available
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, idx) => {
            const imageUrl = SERVICE_IMAGES[svc.slug] || DEFAULT_SERVICE_IMAGE;
            const qty = cart[svc.slug] || 0;
            const isHighlighted = highlightedService === svc.slug;

            return (
              <div 
                key={svc.slug} 
                id={`service-${svc.slug}`}
                className={`group bg-white border flex flex-col relative overflow-hidden rounded-2xl smooth-lift ${
                  isHighlighted 
                    ? "border-black scale-[1.02] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] ring-4 ring-black/5 z-10" 
                    : "border-zinc-200 hover:border-black hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]"
                }`}
                style={{ animationDelay: `${idx * 75}ms` }}
              >
                {/* Product Card Image Header */}
                <div className="h-56 relative w-full overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={imageUrl} 
                    alt={svc.name} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Premium overlay gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
                  
                  {/* Custom popular badge */}
                  {svc.popular && (
                    <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md border border-white/10 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles size={9} className="text-amber-400" />
                      Popular
                    </div>
                  )}

                  {/* Duration and unit tags */}
                  <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-sm text-black text-[9px] font-black tracking-widest uppercase rounded-lg shadow-sm">
                      <Clock size={10} strokeWidth={3} className="text-zinc-650" />
                      {svc.duration}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-black/60 backdrop-blur-sm text-white border border-white/10 text-[9px] font-black tracking-widest uppercase rounded-lg capitalize shadow-sm">
                      {svc.unit.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Card Info Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-black tracking-tight mb-4 group-hover:text-zinc-800 transition-colors">{svc.name}</h3>

                    {/* What's included checklist */}
                    <div className="mb-6">
                      <p className="text-[10px] font-black tracking-widest uppercase text-zinc-400 mb-3">What&apos;s Included</p>
                      <ul className="space-y-2">
                        {svc.includes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-600 leading-normal">
                            <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center mt-0.5 flex-shrink-0">
                              <Check size={10} strokeWidth={3} className="text-emerald-600" />
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Checkout pricing and action footer */}
                <div className="px-6 pb-6 pt-4 border-t border-zinc-150 flex items-center justify-between bg-zinc-50/40">
                  <div>
                    <p className="text-[9px] font-bold tracking-wider uppercase text-zinc-400 mb-0.5">Starting From</p>
                    <p className="text-2xl font-black text-black leading-none">{formatPrice(svc.price)}</p>
                  </div>
                  
                  {/* Cart interactive segment control */}
                  {qty === 0 ? (
                    <button 
                      onClick={() => updateQty(svc.slug, 1)}
                      className="group/btn inline-flex items-center gap-2 bg-black text-white px-5 py-3 text-[10px] font-black tracking-widest uppercase hover:bg-zinc-850 transition-all duration-300 rounded-xl shadow-md cursor-pointer"
                    >
                      Add
                      <ArrowRight size={11} strokeWidth={2.5} className="transition-transform duration-200 group-hover/btn:translate-x-0.5 text-emerald-400" />
                    </button>
                  ) : (
                    <div className="flex items-center bg-black text-white rounded-xl shadow-md p-1 border border-zinc-800">
                      <button 
                        onClick={() => updateQty(svc.slug, -1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-400 hover:text-white"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 text-[11px] font-black tracking-widest text-center min-w-8">
                        {qty}
                      </span>
                      <button 
                        onClick={() => updateQty(svc.slug, 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black hover:bg-zinc-800 transition-colors cursor-pointer text-emerald-450 hover:text-emerald-350"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

