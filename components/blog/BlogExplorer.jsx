"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, Newspaper } from "lucide-react";

export const CAT_STYLES = {
  "AC & Cooling":     { chip: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
  "Appliances":       { chip: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
  "Electrical":       { chip: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  "Maintenance Tips": { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "Buying Guides":    { chip: "bg-violet-50 text-violet-700 border-violet-200",    dot: "bg-violet-500" },
};
const catStyle = (c) => CAT_STYLES[c] || { chip: "bg-zinc-50 text-zinc-600 border-zinc-200", dot: "bg-zinc-400" };

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const initials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "EC";

function PostCard({ post }) {
  const st = catStyle(post.category);
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-900"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className={`absolute left-4 top-4 inline-flex items-center rounded-full border bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm ${st.chip}`}>
          {post.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[17px] font-extrabold leading-snug tracking-tight text-zinc-900 group-hover:underline decoration-[#C8A45C] decoration-2 underline-offset-4">
          {post.title}
        </h3>
        <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-6 text-zinc-500">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 mt-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-[9px] font-extrabold text-[#C8A45C]">
              {initials(post.author?.name)}
            </span>
            <div className="text-[11.5px] leading-tight">
              <p className="font-bold text-zinc-800">{post.author?.name || "EliteCrew Team"}</p>
              <p className="text-zinc-400">{fmtDate(post.createdAt)}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-zinc-400">
            <Clock size={11} /> {post.readMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogExplorer({ posts }) {
  const categories = useMemo(() => ["All", ...new Set(posts.map((p) => p.category))], [posts]);
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);
  const featured = active === "All" ? filtered.find((p) => p.isFeatured) || filtered[0] : null;
  const rest = featured ? filtered.filter((p) => p._id !== featured._id) : filtered;

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-[#fafafa] px-8 py-16 text-center">
        <Newspaper size={28} className="mx-auto mb-4 text-zinc-300" />
        <p className="text-[16px] font-bold text-zinc-900">No articles yet</p>
        <p className="mt-2 text-sm text-zinc-500">New guides are published here regularly — check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Category filter */}
      <div className="mb-10 flex flex-wrap items-center gap-2">
        {categories.map((c) => {
          const count = c === "All" ? posts.length : posts.filter((p) => p.category === c).length;
          const isActive = active === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all ${
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {c !== "All" && <span className={`h-1.5 w-1.5 rounded-full ${catStyle(c).dot}`} />}
              {c}
              <span className="text-zinc-400">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Featured post — big split card */}
      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="group mb-10 grid overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:border-zinc-900 md:grid-cols-[1.1fr_1fr]"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 md:aspect-auto md:min-h-[340px]">
            <img
              src={featured.coverImage}
              alt={featured.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
          <div className="flex flex-col justify-center p-7 md:p-10">
            <div className="mb-4 flex items-center gap-2.5">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${catStyle(featured.category).chip}`}>
                {featured.category}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#fbf8f2] border border-[#e8dcc3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6d33]">
                Featured
              </span>
            </div>
            <h2 className="text-[24px] font-extrabold leading-tight tracking-tight text-zinc-950 md:text-[28px]">
              {featured.title}
            </h2>
            <p className="mt-3 line-clamp-3 text-[14.5px] leading-7 text-zinc-500">{featured.excerpt}</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-extrabold text-[#C8A45C]">
                  {initials(featured.author?.name)}
                </span>
                <div className="text-[12px] leading-tight">
                  <p className="font-bold text-zinc-800">{featured.author?.name || "EliteCrew Team"}</p>
                  <p className="text-zinc-400">
                    {fmtDate(featured.createdAt)} · {featured.readMinutes} min read
                  </p>
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-all group-hover:border-zinc-900 group-hover:bg-zinc-950 group-hover:text-white">
                <ArrowUpRight size={16} />
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}
