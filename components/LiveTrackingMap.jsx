"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Clock, Ruler } from "lucide-react";

// ─── Haversine straight-line distance ─────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = v => (v * Math.PI) / 180;
  const R  = 6371;
  const dL = toRad(lat2 - lat1);
  const dG = toRad(lng2 - lng1);
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dG / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Custom marker HTML ────────────────────────────────────────────────────────
function providerMarkerHtml() {
  return `
    <div style="position:relative;width:44px;height:44px">
      <div class="sm-ping-ring"
           style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.35)"></div>
      <div style="position:absolute;inset:7px;border-radius:50%;background:#2563eb;
                  border:3px solid white;box-shadow:0 3px 14px rgba(37,99,235,0.55);
                  display:flex;align-items:center;justify-content:center">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      </div>
    </div>`;
}

function customerMarkerHtml() {
  return `
    <div style="position:relative;width:36px;height:44px">
      <div style="width:36px;height:36px;background:#16a34a;
                  border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                  border:3px solid white;box-shadow:0 3px 10px rgba(22,163,74,0.5)">
        <div style="transform:rotate(45deg);width:100%;height:100%;
                    display:flex;align-items:center;justify-content:center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
      </div>
    </div>`;
}

// ─── OSRM road-routing ────────────────────────────────────────────────────────
async function fetchRoute(L, map, routeLayerRef, pLat, pLng, cLat, cLng) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pLng},${pLat};${cLng},${cLat}?overview=full&geometries=geojson`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error("OSRM error");
    const data  = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error("No route");

    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    routeLayerRef.current = L.polyline(coords, {
      color:     "#2563eb",
      weight:    5,
      opacity:   0.85,
      lineJoin:  "round",
      lineCap:   "round",
    }).addTo(map);

    return {
      distKm:    (route.distance / 1000).toFixed(1),
      durationMin: Math.ceil(route.duration / 60),
    };
  } catch {
    // Fallback: dashed straight line
    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    routeLayerRef.current = L.polyline([[pLat, pLng], [cLat, cLng]], {
      color:     "#2563eb",
      weight:    3,
      opacity:   0.5,
      dashArray: "10 8",
    }).addTo(map);
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
// Props:
//   providerLat / providerLng   — provider live GPS (null = not sharing yet)
//   customerLat / customerLng   — customer's service address coords (null = address only)
//   providerLabel               — label shown on provider popup (default "Technician")
//   customerLabel               — label shown on customer popup  (default "Your Location")
//   height                      — Tailwind height class           (default "h-[400px]")
export default function LiveTrackingMap({
  providerLat,
  providerLng,
  customerLat,
  customerLng,
  providerLabel = "Technician",
  customerLabel = "Your Location",
  height = "h-[400px]",
}) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const LRef            = useRef(null);
  const providerPinRef  = useRef(null);
  const customerPinRef  = useRef(null);
  const routeLayerRef   = useRef(null);
  const [routeInfo,     setRouteInfo]     = useState(null); // { distKm, durationMin }
  const [mapReady,      setMapReady]      = useState(false);

  // ── Mount map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Capture the container element so the cleanup closure has a stable ref
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    // `cancelled` is set synchronously by the cleanup.  Any pending .then()
    // callbacks check this flag so they bail out before touching the DOM —
    // this is what prevents the "already initialized" crash in React Strict Mode
    // where the effect is deliberately run twice (mount → cleanup → mount).
    let cancelled = false;

    import("leaflet").then(({ default: L }) => {
      // ── Guard 1: cleanup already ran (Strict Mode / fast unmount) ──────
      if (cancelled) return;

      // ── Guard 2: a concurrent run of this effect already succeeded ─────
      if (mapRef.current) return;

      // ── Guard 3: Leaflet stamps _leaflet_id on the DOM element when a
      //    map is created. If this property exists, another map already
      //    owns this container — we must not create a second one. ──────────
      if ("_leaflet_id" in container) return;

      LRef.current = L;

      const initLat = providerLat ?? customerLat ?? 20.5937; // centre of India
      const initLng = providerLng ?? customerLng ?? 78.9629;

      const map = L.map(container, {
        zoomControl:      true,
        scrollWheelZoom:  false, // don't hijack page scroll
      }).setView([initLat, initLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Provider marker (only if location available on first render)
      if (Number.isFinite(providerLat) && Number.isFinite(providerLng)) {
        const icon = L.divIcon({
          html: providerMarkerHtml(),
          iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -24],
          className: "",
        });
        providerPinRef.current = L.marker([providerLat, providerLng], { icon })
          .bindPopup(`<b>${providerLabel}</b><br><span style="font-size:11px;color:#6b7280">Live location</span>`)
          .addTo(map);
      }

      // Customer marker
      if (Number.isFinite(customerLat) && Number.isFinite(customerLng)) {
        const icon = L.divIcon({
          html: customerMarkerHtml(),
          iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44],
          className: "",
        });
        customerPinRef.current = L.marker([customerLat, customerLng], { icon })
          .bindPopup(`<b>${customerLabel}</b><br><span style="font-size:11px;color:#6b7280">Service address</span>`)
          .addTo(map);
      }

      // Final cancelled check — cleanup might have run while markers were being built
      if (cancelled) {
        map.remove();
        return;
      }

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      // Destroy the saved map instance (if the .then() had already stored it)
      mapRef.current?.remove();
      mapRef.current        = null;
      providerPinRef.current = null;
      customerPinRef.current = null;
      routeLayerRef.current  = null;
      LRef.current           = null;
      // Reset ready flag so the location-update effect doesn't access stale refs
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only

  // ── React to provider location changes ────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current) return;
    const L   = LRef.current;
    const map = mapRef.current;

    if (!Number.isFinite(providerLat) || !Number.isFinite(providerLng)) return;

    if (providerPinRef.current) {
      // Smooth update — just move the existing marker
      providerPinRef.current.setLatLng([providerLat, providerLng]);
    } else {
      const icon = L.divIcon({
        html: providerMarkerHtml(),
        iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -24],
        className: "",
      });
      providerPinRef.current = L.marker([providerLat, providerLng], { icon })
        .bindPopup(`<b>${providerLabel}</b><br><span style="font-size:11px;color:#6b7280">Live location</span>`)
        .addTo(map);
    }

    // Fit both markers in view
    const points = [[providerLat, providerLng]];
    if (Number.isFinite(customerLat) && Number.isFinite(customerLng)) {
      points.push([customerLat, customerLng]);
    }
    if (points.length === 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 16 });
    } else {
      map.setView([providerLat, providerLng], 15);
    }

    // Fetch/refresh road route
    if (Number.isFinite(customerLat) && Number.isFinite(customerLng)) {
      fetchRoute(L, map, routeLayerRef, providerLat, providerLng, customerLat, customerLng)
        .then(info => setRouteInfo(info));
    }
  }, [mapReady, providerLat, providerLng, customerLat, customerLng, providerLabel]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const hasProvider = Number.isFinite(providerLat) && Number.isFinite(providerLng);
  const hasCustomer = Number.isFinite(customerLat) && Number.isFinite(customerLng);

  const straightKm = hasProvider && hasCustomer
    ? haversineKm(providerLat, providerLng, customerLat, customerLng)
    : null;

  const displayDist = routeInfo?.distKm ?? (straightKm ? straightKm.toFixed(1) : null);
  const displayEta  = routeInfo?.durationMin ?? (straightKm ? Math.ceil(straightKm * 4) : null);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-zinc-200 shadow-lg`}>
      {/* Map canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Info card overlaid at the bottom */}
      <div className="absolute bottom-3 left-3 right-3 z-[800] pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm border border-zinc-200 rounded-xl shadow-lg px-4 py-3">
          <div className="flex items-center gap-5 flex-wrap">

            {/* Provider location status */}
            {!hasProvider && (
              <div className="flex items-center gap-2 flex-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                  Waiting for provider location…
                </p>
              </div>
            )}

            {/* Distance */}
            {displayDist && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Ruler size={12} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Distance</p>
                  <p className="text-sm font-extrabold text-black leading-tight">{displayDist} km</p>
                </div>
              </div>
            )}

            {/* ETA */}
            {displayEta && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock size={12} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">ETA</p>
                  <p className="text-sm font-extrabold text-black leading-tight">{displayEta} min</p>
                </div>
              </div>
            )}

            {/* Legend */}
            {hasProvider && (
              <div className="ml-auto flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Provider</span>
                </div>
                {hasCustomer && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">You</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Route type note */}
          {hasProvider && hasCustomer && !routeInfo && displayDist && (
            <p className="text-[9px] text-zinc-400 mt-1.5 font-medium">
              ↗ Straight-line estimate · road route loading…
            </p>
          )}
          {routeInfo && (
            <p className="text-[9px] text-zinc-400 mt-1.5 font-medium">
              Road route via OpenStreetMap · updates as provider moves
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
