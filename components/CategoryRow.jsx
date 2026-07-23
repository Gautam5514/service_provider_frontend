"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock, Star } from "lucide-react";
import { formatPrice } from "@/lib/services";

/**
 * One intent group rendered as a horizontal slider. Cards stay on a single
 * row and scroll (snap) instead of wrapping onto 2–3 lines. Arrow buttons
 * appear on desktop only when there's actually overflow to scroll.
 */
export default function CategoryRow({ group, items }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, items.length]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    // Roughly one card + gap, so a click advances a full tile.
    el.scrollBy({ left: dir * (el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 leading-tight">{group.title}</h3>
          <p className="text-xs text-zinc-400 mt-1 truncate">{group.blurb}</p>
        </div>

        {/* Desktop arrows — only when the row overflows */}
        {(canPrev || canNext) && (
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={!canPrev}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-200 text-zinc-600 transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={!canNext}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-200 text-zinc-600 transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 pb-1"
      >
        {items.map(({ key, meta, ins, count, minPrice, photo }) => (
          <Link
            key={key}
            href={`/services/${key}`}
            className="group relative flex flex-col shrink-0 snap-start w-[240px] sm:w-[260px] overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-150 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_-24px_rgba(0,0,0,0.35)] hover:ring-zinc-200"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
              {photo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photo}
                  alt={meta.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />

              <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur px-1.5 py-0.5 text-[10px] font-bold text-zinc-900 shadow-sm">
                <Star size={9} className="fill-amber-400 text-amber-400" /> {ins.rating}
              </span>

              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
                <Clock size={9} strokeWidth={2.5} /> {ins.eta}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-zinc-900 tracking-tight truncate leading-tight">
                  {meta.label}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 truncate">
                  {minPrice != null && (
                    <span className="text-zinc-900 font-bold">{formatPrice(minPrice)}</span>
                  )}
                  {minPrice != null && " · "}
                  {count} service{count === 1 ? "" : "s"}
                </p>
              </div>
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-500 transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                <ArrowUpRight size={13} strokeWidth={2.5} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
