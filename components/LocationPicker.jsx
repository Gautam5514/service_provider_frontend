"use client";

// Full-screen address picker for the web (customer + provider).
// Manual: Google Places search (via our backend proxy) or drag the map pin.
// Auto:   "Use current location" (browser geolocation).
// onConfirm receives { lat, lng, fullAddress, city, pincode }.
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, LocateFixed, MapPin, Loader2 } from "lucide-react";
import api from "@/lib/api";

const INDIA = { lat: 20.5937, lng: 78.9629 };

function newSession() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function LocationPicker({ initial, onConfirm, onClose }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const sessionRef = useRef(newSession());
  const searchTimer = useRef(null);
  const geoTimer = useRef(null);

  const [coords, setCoords] = useState(
    initial?.lat ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [resolved, setResolved] = useState({
    fullAddress: initial?.fullAddress || "",
    city: initial?.city || "",
    pincode: initial?.pincode || "",
  });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Debounced reverse geocode whenever the pin settles.
  const resolveAt = useCallback((lat, lng) => {
    clearTimeout(geoTimer.current);
    setResolving(true);
    geoTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/places/reverse", { params: { lat, lng } });
        if (data?.place) {
          setResolved((prev) => ({
            fullAddress: data.place.fullAddress || prev.fullAddress,
            city: data.place.city || prev.city,
            pincode: data.place.pincode || prev.pincode,
          }));
        }
      } catch {
        /* keep previous resolved text */
      } finally {
        setResolving(false);
      }
    }, 400);
  }, []);

  // Init Leaflet map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    import("leaflet").then(({ default: L }) => {
      if (cancelled || mapRef.current || "_leaflet_id" in container) return;
      const start = coords || INDIA;
      const map = L.map(container, { zoomControl: true, scrollWheelZoom: true })
        .setView([start.lat, start.lng], coords ? 16 : 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      map.on("moveend", () => {
        const c = map.getCenter();
        setCoords({ lat: c.lat, lng: c.lng });
        resolveAt(c.lat, c.lng);
      });

      // No initial spot? Try the browser location once on open.
      if (!coords) locate(map, L, true);
    });

    return () => {
      cancelled = true;
      clearTimeout(searchTimer.current);
      clearTimeout(geoTimer.current);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function recenter(lat, lng) {
    mapRef.current?.setView([lat, lng], 16, { animate: true });
    setCoords({ lat, lng });
    resolveAt(lat, lng);
  }

  function locate(map, L, silent = false) {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        (map || mapRef.current)?.setView([latitude, longitude], 16, { animate: true });
        setCoords({ lat: latitude, lng: longitude });
        resolveAt(latitude, longitude);
        setLocating(false);
      },
      () => { setLocating(false); },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  }

  function onChangeQuery(text) {
    setQuery(text);
    clearTimeout(searchTimer.current);
    if (text.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/places/autocomplete", {
          params: { input: text, session: sessionRef.current },
        });
        setResults(data?.predictions || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function pickPrediction(item) {
    setQuery(item.primary);
    setResults([]);
    setResolving(true);
    try {
      const { data } = await api.get("/places/details", {
        params: { placeId: item.placeId, session: sessionRef.current },
      });
      sessionRef.current = newSession();
      const p = data?.place;
      if (p?.lat) recenter(p.lat, p.lng);
      setResolved({ fullAddress: p?.fullAddress || "", city: p?.city || "", pincode: p?.pincode || "" });
    } catch {
      /* ignore */
    } finally {
      setResolving(false);
    }
  }

  const canConfirm = coords && resolved.fullAddress;

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col">
      {/* Map fills everything; controls float over it */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Fixed center pin */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[1001]" style={{ marginBottom: 24 }}>
        <MapPin size={40} className="text-black drop-shadow-md" fill="black" stroke="white" />
      </div>

      {/* Top: back + search */}
      <div className="absolute top-0 inset-x-0 z-[1002] p-3 sm:p-4">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <button onClick={onClose} className="shrink-0 w-10 h-10 grid place-items-center rounded-lg bg-white border border-zinc-300 hover:border-black transition-colors">
            <X size={18} className="text-black" />
          </button>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              placeholder="Search area, street, landmark…"
              className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-9 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.06] transition-all placeholder:text-zinc-400 shadow-sm"
            />
            {searching ? (
              <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
            ) : query ? (
              <button onClick={() => onChangeQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
                <X size={15} />
              </button>
            ) : null}

            {results.length > 0 && (
              <div className="absolute top-full mt-1.5 inset-x-0 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.placeId}
                    onClick={() => pickPrediction(r)}
                    className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-0"
                  >
                    <MapPin size={15} className="text-zinc-400 mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-black truncate">{r.primary}</span>
                      {r.secondary && <span className="block text-xs text-zinc-500 truncate">{r.secondary}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Use current location */}
      <button
        onClick={() => locate()}
        className="absolute right-4 bottom-44 z-[1002] flex items-center gap-2 bg-white border border-zinc-300 hover:border-black rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black shadow-sm transition-colors"
      >
        {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
        Current location
      </button>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 inset-x-0 z-[1002] bg-white border-t border-zinc-200 rounded-t-2xl p-5 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Selected location</p>
          <div className="flex items-start gap-2.5 mt-2 mb-4 min-h-[44px]">
            <MapPin size={18} className="text-black mt-0.5 shrink-0" />
            <div className="min-w-0">
              {resolving ? (
                <p className="text-sm text-zinc-500">Finding address…</p>
              ) : (
                <>
                  <p className="text-sm font-bold text-black">
                    {resolved.fullAddress || "Move the map or search to set a spot"}
                  </p>
                  {(resolved.city || resolved.pincode) && (
                    <p className="text-xs text-zinc-500">
                      {resolved.city}{resolved.pincode ? ` · ${resolved.pincode}` : ""}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => canConfirm && onConfirm({ ...coords, ...resolved })}
            disabled={!canConfirm}
            className="w-full bg-black text-white rounded-lg py-3 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
