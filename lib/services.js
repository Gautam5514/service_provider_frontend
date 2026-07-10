// Static service catalog — mirrors the backend seed data.
// Used for display on home + category pages without a DB round-trip.

import { AirVent, Armchair, Bath, Bug, Car, Fan, Flower2, Hand, Paintbrush, Plug, Refrigerator, Scissors, Shirt, Sparkles, Truck, Tv, Wind, Wrench, Zap } from "lucide-react";

export const CATEGORY_META = {
  ac:          { label: "AC Services",       icon: AirVent,   color: "bg-sky-50    border-sky-200    text-sky-700",    description: "Repair, installation, deep cleaning & gas refilling" },
  cooler:      { label: "Cooler Services",   icon: Wind,      color: "bg-teal-50   border-teal-200   text-teal-700",   description: "Full service, repair & installation for all cooler types" },
  fan:         { label: "Fan Services",      icon: Fan,       color: "bg-violet-50 border-violet-200 text-violet-700", description: "Ceiling & wall fan repair, installation and servicing" },
  tv:          { label: "TV & Display",      icon: Tv,        color: "bg-indigo-50 border-indigo-200 text-indigo-700", description: "TV repair, LED panel fix & wall mounting" },
  fridge:      { label: "Fridge Services",   icon: Refrigerator, color: "bg-cyan-50 border-cyan-200 text-cyan-700", description: "Fridge repair, cooling issue diagnosis and gas refill" },
  electrical:  { label: "Electrical Work",   icon: Zap,       color: "bg-amber-50  border-amber-200  text-amber-700",  description: "Wiring, switches, MCB, sockets and fault diagnosis" },
  appliance:   { label: "Appliances",        icon: Plug,      color: "bg-rose-50   border-rose-200   text-rose-700",   description: "Washing machine, geyser, microwave & other home appliances" },
  cleaning:    { label: "Cleaning",          icon: Sparkles,  color: "bg-emerald-50 border-emerald-200 text-emerald-700", description: "Bathroom, kitchen, sofa and full home deep cleaning" },
  plumbing:    { label: "Plumbing",          icon: Bath,      color: "bg-blue-50    border-blue-200    text-blue-700",    description: "Tap, flush, pipe leakage, drain and tank services" },
  carpentry:   { label: "Carpentry",         icon: Armchair,  color: "bg-orange-50  border-orange-200  text-orange-700",  description: "Locks, furniture assembly, curtain rods and wood repairs" },
  "pest-control": { label: "Pest Control",   icon: Bug,       color: "bg-lime-50    border-lime-200    text-lime-700",    description: "Cockroach, termite, bed bug and mosquito treatment" },
  painting:    { label: "Painting",          icon: Paintbrush,color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700", description: "Wall painting, dampness repair and texture finishes" },
  laundry:     { label: "Laundry",           icon: Shirt,     color: "bg-purple-50  border-purple-200  text-purple-700",  description: "Cloth wash, dry cleaning, steam ironing and shoe care" },
  "car-wash":  { label: "Car Wash",          icon: Car,       color: "bg-slate-50   border-slate-200   text-slate-700",   description: "Exterior wash, interior cleaning and deep detailing" },
  beauty:      { label: "Beauty at Home",    icon: Hand,      color: "bg-pink-50    border-pink-200    text-pink-700",    description: "Haircut, facial, manicure, pedicure and waxing services" },
  grooming:    { label: "Men's Grooming",    icon: Scissors,  color: "bg-stone-50   border-stone-200   text-stone-700",   description: "Haircut, beard styling and head massage at home" },
  moving:      { label: "Moving Help",       icon: Truck,     color: "bg-yellow-50  border-yellow-200  text-yellow-700",  description: "Home shifting, furniture movement and packing support" },
  gardening:   { label: "Gardening",         icon: Flower2,   color: "bg-green-50   border-green-200   text-green-700",   description: "Garden maintenance, plant care and lawn mowing" },
  other:       { label: "More Services",     icon: Wrench,    color: "bg-zinc-50   border-zinc-200   text-zinc-700",   description: "Plumbing, painting, pest control and other home services" },
};

export const SERVICE_CATALOG = {
  ac: [
    { slug: "ac-repair",          name: "AC Repair",         price: 499,  unit: "per_visit", duration: "60–90 min", popular: true,  includes: ["Full diagnosis", "Basic repair", "Gas pressure check", "Test run"] },
    { slug: "ac-installation",    name: "AC Installation",   price: 999,  unit: "per_visit", duration: "2–3 hrs",   popular: true,  includes: ["Wall mounting", "Copper piping", "Electrical connection", "Demo"] },
    { slug: "ac-deep-cleaning",   name: "AC Deep Cleaning",  price: 799,  unit: "per_visit", duration: "60–90 min", popular: false, includes: ["Filter cleaning", "Coil cleaning", "Drain flush", "Anti-bacterial spray"] },
    { slug: "ac-gas-refilling",   name: "AC Gas Refilling",  price: 1299, unit: "per_visit", duration: "60 min",    popular: false, includes: ["Gas level check", "Leak detection", "Refrigerant refill", "Pressure test"] },
    { slug: "ac-uninstallation",  name: "AC Uninstallation", price: 399,  unit: "per_visit", duration: "45–60 min", popular: false, includes: ["Safe dismounting", "Gas recovery", "Pipe capping"] },
  ],
  cooler: [
    { slug: "cooler-repair",      name: "Cooler Repair",        price: 349, unit: "per_visit", duration: "45–60 min", popular: true,  includes: ["Motor & pump check", "Pad inspection", "Electrical check", "Basic repair"] },
    { slug: "cooler-service",     name: "Cooler Full Service",  price: 499, unit: "per_visit", duration: "75–90 min", popular: false, includes: ["Full cleaning", "Pad replacement", "Pump overhaul", "Lubrication"] },
    { slug: "cooler-installation",name: "Cooler Installation",  price: 599, unit: "per_visit", duration: "75–90 min", popular: false, includes: ["Placement & mounting", "Water connection", "Electrical setup", "Test run"] },
  ],
  fan: [
    { slug: "fan-repair",       name: "Fan Repair",       price: 199, unit: "per_visit", duration: "30–45 min", popular: true,  includes: ["Diagnosis", "Capacitor check", "Winding inspection", "Basic repair"] },
    { slug: "fan-installation", name: "Fan Installation", price: 299, unit: "per_visit", duration: "30–45 min", popular: false, includes: ["Ceiling/wall mounting", "Electrical connection", "Blade balancing", "Test"] },
    { slug: "fan-servicing",    name: "Fan Servicing",    price: 149, unit: "per_visit", duration: "30 min",    popular: false, includes: ["Full cleaning", "Blade balancing", "Bearing lubrication"] },
  ],
  tv: [
    { slug: "tv-repair",       name: "TV Repair",        price: 499, unit: "per_visit", duration: "60–120 min", popular: true,  includes: ["Full diagnosis", "Board inspection", "Basic repair", "Test"] },
    { slug: "tv-wall-mounting",name: "TV Wall Mounting", price: 599, unit: "per_visit", duration: "45–60 min",  popular: false, includes: ["Bracket installation", "Cable management", "Level alignment", "Safety check"] },
  ],
  fridge: [
    { slug: "fridge-repair",     name: "Fridge Repair",     price: 499,  unit: "per_visit", duration: "60–90 min", popular: true,  includes: ["Cooling diagnosis", "Compressor check", "Thermostat inspection", "Basic repair"] },
    { slug: "fridge-gas-refill", name: "Fridge Gas Refill", price: 1199, unit: "per_visit", duration: "75–90 min", popular: false, includes: ["Leak check", "Gas refill", "Pressure testing", "Cooling test"] },
  ],
  electrical: [
    { slug: "electrical-work",  name: "Electrical Work",   price: 299, unit: "per_visit", duration: "45–60 min", popular: true,  includes: ["Switch/socket repair", "Wiring check", "MCB/fuse work", "Safety inspection"] },
    { slug: "wiring-cabling",   name: "Wiring & Cabling",  price: 499, unit: "per_visit", duration: "75–90 min", popular: false, includes: ["New wiring", "Cable routing", "Junction box", "Testing"] },
  ],
  appliance: [
    { slug: "appliance-repair",          name: "Appliance Repair",          price: 399, unit: "per_visit", duration: "60–90 min", popular: true,  includes: ["Diagnosis", "Component check", "Basic repair", "Test run"] },
    { slug: "washing-machine-repair",    name: "Washing Machine Repair",    price: 499, unit: "per_visit", duration: "75–90 min", popular: false, includes: ["Motor check", "Drum inspection", "Belt & pump check", "Test run"] },
  ],
  cleaning: [
    { slug: "bathroom-deep-cleaning", name: "Bathroom Deep Cleaning", price: 499, unit: "per_visit", duration: "90 min", popular: true, includes: ["Toilet and basin cleaning", "Tile scrubbing", "Hard-water stain removal", "Floor sanitisation"] },
    { slug: "kitchen-deep-cleaning", name: "Kitchen Deep Cleaning", price: 799, unit: "per_visit", duration: "120 min", popular: true, includes: ["Countertop degreasing", "Sink and tile cleaning", "Cabinet exterior wipe", "Floor cleaning"] },
    { slug: "full-home-deep-cleaning", name: "Full Home Deep Cleaning", price: 2499, unit: "per_visit", duration: "6 hrs", popular: true, includes: ["Room dusting", "Bathroom cleaning", "Kitchen cleaning", "Floor scrubbing"] },
    { slug: "sofa-shampoo-cleaning", name: "Sofa Shampoo Cleaning", price: 699, unit: "per_visit", duration: "90 min", popular: false, includes: ["Vacuuming", "Shampoo treatment", "Spot cleaning", "Drying guidance"] },
    { slug: "carpet-cleaning", name: "Carpet Cleaning", price: 599, unit: "per_visit", duration: "75 min", popular: false, includes: ["Dust removal", "Shampoo cleaning", "Stain treatment", "Odour control"] },
    { slug: "mattress-cleaning", name: "Mattress Cleaning", price: 599, unit: "per_visit", duration: "75 min", popular: false, includes: ["Vacuuming", "Fabric shampoo", "Dust mite treatment", "Drying guidance"] },
    { slug: "balcony-cleaning", name: "Balcony Cleaning", price: 399, unit: "per_visit", duration: "60 min", popular: false, includes: ["Floor scrubbing", "Railing wipe", "Cobweb removal", "Drain clean-up"] },
    { slug: "move-in-move-out-cleaning", name: "Move-in Move-out Cleaning", price: 2999, unit: "per_visit", duration: "7 hrs", popular: false, includes: ["Whole-home dusting", "Kitchen and bathroom deep clean", "Cabinet wipe", "Floor scrubbing"] },
    { slug: "regular-housekeeping", name: "Regular Housekeeping", price: 299, unit: "per_hour", duration: "120 min", popular: false, includes: ["Dusting", "Sweeping and mopping", "Utensil support", "Room tidying"] },
    { slug: "window-glass-cleaning", name: "Window and Glass Cleaning", price: 499, unit: "per_visit", duration: "90 min", popular: false, includes: ["Interior glass wipe", "Frame cleaning", "Grill dusting", "Streak-free finish"] }
  ],
  plumbing: [
    { slug: "tap-mixer-repair", name: "Tap & Mixer Repair", price: 249, unit: "per_visit", duration: "45 min", popular: true, includes: ["Leak diagnosis", "Washer check", "Mixer inspection", "Basic repair"] },
    { slug: "toilet-flush-repair", name: "Toilet Flush Repair", price: 299, unit: "per_visit", duration: "60 min", popular: false, includes: ["Flush tank check", "Valve repair", "Leak check", "Function test"] },
    { slug: "drain-unclogging", name: "Drain Unclogging", price: 399, unit: "per_visit", duration: "75 min", popular: false, includes: ["Blockage inspection", "Drain clearing", "Odour check", "Flow test"] },
    { slug: "water-tank-cleaning", name: "Water Tank Cleaning", price: 899, unit: "per_visit", duration: "120 min", popular: false, includes: ["Tank draining", "Sludge removal", "Scrubbing", "Disinfection"] },
    { slug: "pipe-leakage-repair", name: "Pipe Leakage Repair", price: 449, unit: "per_visit", duration: "90 min", popular: false, includes: ["Leak tracing", "Joint sealing", "Pipe section check", "Water flow test"] }
  ],
  carpentry: [
    { slug: "door-lock-installation", name: "Door Lock Installation", price: 349, unit: "per_visit", duration: "60 min", popular: true, includes: ["Lock fitting", "Alignment check", "Screw tightening", "Key test"] },
    { slug: "furniture-assembly", name: "Furniture Assembly", price: 499, unit: "per_visit", duration: "120 min", popular: false, includes: ["Parts inspection", "Assembly", "Alignment", "Final tightening"] },
    { slug: "bed-repair", name: "Bed Repair", price: 399, unit: "per_visit", duration: "75 min", popular: false, includes: ["Frame inspection", "Joint tightening", "Minor repair", "Stability check"] },
    { slug: "curtain-rod-installation", name: "Curtain Rod Installation", price: 299, unit: "per_visit", duration: "60 min", popular: false, includes: ["Wall drilling", "Bracket fitting", "Rod alignment", "Load check"] },
    { slug: "modular-furniture-repair", name: "Modular Furniture Repair", price: 599, unit: "per_visit", duration: "120 min", popular: false, includes: ["Hinge check", "Drawer channel repair", "Door alignment", "Basic hardware fix"] }
  ],
  "pest-control": [
    { slug: "cockroach-pest-control", name: "Cockroach Pest Control", price: 799, unit: "per_visit", duration: "90 min", popular: true, includes: ["Gel treatment", "Kitchen hotspots", "Bathroom hotspots", "Safety guidance"] },
    { slug: "termite-treatment", name: "Termite Treatment", price: 1499, unit: "per_visit", duration: "180 min", popular: false, includes: ["Termite inspection", "Chemical treatment", "Woodwork focus", "Prevention tips"] },
    { slug: "bed-bug-treatment", name: "Bed Bug Treatment", price: 1299, unit: "per_visit", duration: "150 min", popular: false, includes: ["Bed and sofa inspection", "Spray treatment", "Crack treatment", "Follow-up guidance"] },
    { slug: "mosquito-control", name: "Mosquito Control", price: 699, unit: "per_visit", duration: "75 min", popular: false, includes: ["Breeding spot check", "Spray treatment", "Drain focus", "Prevention guidance"] }
  ],
  painting: [
    { slug: "single-wall-painting", name: "Single Wall Painting", price: 999, unit: "per_visit", duration: "4 hrs", popular: true, includes: ["Surface prep", "Primer check", "Two coats", "Basic cleanup"] },
    { slug: "room-painting", name: "Room Painting", price: 2999, unit: "per_visit", duration: "8 hrs", popular: false, includes: ["Wall preparation", "Putty touch-up", "Painting", "Basic cleanup"] },
    { slug: "wall-dampness-repair", name: "Wall Dampness Repair", price: 1499, unit: "per_visit", duration: "240 min", popular: false, includes: ["Dampness inspection", "Scraping", "Patch treatment", "Primer application"] },
    { slug: "texture-wall-painting", name: "Texture Wall Painting", price: 2499, unit: "per_visit", duration: "6 hrs", popular: false, includes: ["Design consultation", "Surface prep", "Texture coat", "Finish check"] }
  ],
  laundry: [
    { slug: "cloth-wash-fold", name: "Cloth Wash & Fold", price: 199, unit: "per_visit", duration: "60 min", popular: true, includes: ["Pickup coordination", "Machine wash", "Drying", "Folded return"] },
    { slug: "dry-cleaning", name: "Dry Cleaning", price: 299, unit: "per_visit", duration: "60 min", popular: false, includes: ["Pickup coordination", "Fabric check", "Dry clean processing", "Packed return"] },
    { slug: "steam-ironing", name: "Steam Ironing", price: 149, unit: "per_visit", duration: "60 min", popular: false, includes: ["Garment count check", "Steam ironing", "Folding or hanger packing", "Delivery handoff"] },
    { slug: "shoe-cleaning", name: "Shoe Cleaning", price: 249, unit: "per_visit", duration: "60 min", popular: false, includes: ["Dust removal", "Sole cleaning", "Upper cleaning", "Drying guidance"] },
    { slug: "curtain-laundry", name: "Curtain Laundry", price: 399, unit: "per_visit", duration: "90 min", popular: false, includes: ["Curtain pickup", "Wash or dry-clean check", "Processing", "Packed return"] }
  ],
  "car-wash": [
    { slug: "car-exterior-wash", name: "Car Exterior Wash", price: 299, unit: "per_visit", duration: "45 min", popular: true, includes: ["Foam wash", "Body rinse", "Tyre cleaning", "Microfiber wipe"] },
    { slug: "car-interior-cleaning", name: "Car Interior Cleaning", price: 599, unit: "per_visit", duration: "90 min", popular: false, includes: ["Vacuuming", "Dashboard wipe", "Mat cleaning", "Door pad cleaning"] },
    { slug: "car-deep-cleaning", name: "Car Deep Cleaning", price: 1199, unit: "per_visit", duration: "150 min", popular: false, includes: ["Exterior wash", "Interior vacuum", "Seat cleaning", "Dashboard polish"] },
    { slug: "bike-wash", name: "Bike Wash", price: 149, unit: "per_visit", duration: "35 min", popular: false, includes: ["Foam wash", "Rinse", "Chain area wipe", "Microfiber dry"] }
  ],
  beauty: [
    { slug: "women-haircut-at-home", name: "Women Haircut at Home", price: 499, unit: "per_visit", duration: "75 min", popular: true, includes: ["Style consultation", "Haircut", "Basic blow dry", "Clean-up"] },
    { slug: "facial-cleanup", name: "Facial Cleanup", price: 699, unit: "per_visit", duration: "75 min", popular: false, includes: ["Cleansing", "Scrub", "Massage", "Face pack"] },
    { slug: "manicure-pedicure", name: "Manicure & Pedicure", price: 799, unit: "per_visit", duration: "90 min", popular: false, includes: ["Nail shaping", "Cuticle care", "Massage", "Polish application"] },
    { slug: "waxing-service", name: "Waxing Service", price: 499, unit: "per_visit", duration: "75 min", popular: false, includes: ["Skin prep", "Waxing", "After-care wipe", "Hygiene disposal"] }
  ],
  grooming: [
    { slug: "men-haircut-at-home", name: "Men Haircut at Home", price: 249, unit: "per_visit", duration: "45 min", popular: true, includes: ["Haircut", "Neck cleanup", "Basic styling", "Clean-up"] },
    { slug: "beard-styling", name: "Beard Styling", price: 199, unit: "per_visit", duration: "30 min", popular: false, includes: ["Beard trim", "Line-up", "Moustache trim", "After-care wipe"] },
    { slug: "head-massage", name: "Head Massage", price: 399, unit: "per_visit", duration: "45 min", popular: false, includes: ["Oil application", "Head massage", "Neck focus", "Relaxation guidance"] }
  ],
  moving: [
    { slug: "packers-movers-survey", name: "Packers & Movers Survey", price: 199, unit: "per_visit", duration: "45 min", popular: false, includes: ["Inventory check", "Packing estimate", "Vehicle estimate", "Quote handoff"] },
    { slug: "home-shifting-help", name: "Home Shifting Help", price: 1499, unit: "per_visit", duration: "4 hrs", popular: true, includes: ["Packing support", "Loading help", "Unloading help", "Basic placement"] },
    { slug: "furniture-moving-help", name: "Furniture Moving Help", price: 799, unit: "per_visit", duration: "120 min", popular: false, includes: ["Furniture lifting", "Room-to-room movement", "Basic dismantle support", "Placement"] }
  ],
  gardening: [
    { slug: "garden-maintenance", name: "Garden Maintenance", price: 599, unit: "per_visit", duration: "120 min", popular: false, includes: ["Plant trimming", "Weeding", "Watering support", "Cleanup"] },
    { slug: "plant-care-visit", name: "Plant Care Visit", price: 299, unit: "per_visit", duration: "60 min", popular: false, includes: ["Plant health check", "Watering", "Pruning", "Care tips"] },
    { slug: "lawn-mowing", name: "Lawn Mowing", price: 699, unit: "per_visit", duration: "120 min", popular: false, includes: ["Grass cutting", "Edge trimming", "Waste collection", "Basic cleanup"] }
  ],
  // Populated by the admin from the dashboard — served live from the API.
  other: [],
};

// Flat lookup by slug
export function getServiceBySlug(slug) {
  for (const services of Object.values(SERVICE_CATALOG)) {
    const found = services.find(s => s.slug === slug);
    if (found) return found;
  }
  return null;
}

export function getCategoryForSlug(slug) {
  for (const [cat, services] of Object.entries(SERVICE_CATALOG)) {
    if (services.find(s => s.slug === slug)) return cat;
  }
  return null;
}

export const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "18:00", label: "6:00 PM" },
];

export function formatPrice(p) {
  return `₹${p.toLocaleString("en-IN")}`;
}

// Provider take-home for a job: base price minus platform fee and GST.
// This is the ONLY amount a provider should ever see — never the customer total.
export function providerPayout(pricing = {}) {
  const base = pricing?.basePrice || 0;
  const fee = pricing?.platformFee || 0;
  const tax = pricing?.tax || 0;
  return Math.max(0, base - fee - tax);
}

export function formatDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
