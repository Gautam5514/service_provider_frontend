"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "lucide-react";

const CATEGORIES = ["AC & Cooling", "Appliances", "Electrical", "Maintenance Tips", "Buying Guides"];

// Real photos already shipped with the site — quick-pick covers for new posts.
const COVER_PRESETS = [
  "/images/ac.webp",
  "/images/ac_repair.png",
  "/images/ac_deep_cleaning.png",
  "/images/ac_gas_refilling.png",
  "/images/ac_installation.png",
  "/images/refrigerator.webp",
  "/images/fridge_repair.png",
  "/images/washing_machine_repair.png",
  "/images/electricboard.webp",
  "/images/electrical_work.png",
  "/images/wiring_cabling.png",
  "/images/cooler_service.png",
  "/images/fan_repair.png",
  "/images/tv_wall_mounting.png",
  "/hero/acrepair.webp",
  "/hero/electrician.webp",
  "/hero/washing.webp",
  "/hero/fridges.webp",
];

const BLANK = {
  title: "",
  category: "Maintenance Tips",
  excerpt: "",
  content: "",
  coverImage: COVER_PRESETS[0],
  tags: "",
  authorName: "",
  isPublished: true,
  isFeatured: false,
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data } = await api.get("/blog/admin/all");
      setPosts(data.posts || []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(BLANK);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (post) => {
    setEditingId(post._id);
    setForm({
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      tags: (post.tags || []).join(", "),
      authorName: post.author?.name || "",
      isPublished: post.isPublished,
      isFeatured: post.isFeatured,
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim())   return setFormError("Post title is required.");
    if (!form.excerpt.trim()) return setFormError("A short excerpt is required.");
    if (!form.content.trim()) return setFormError("Post content is required.");

    setFormBusy(true);
    try {
      if (editingId) {
        await api.put(`/blog/admin/${editingId}`, form);
      } else {
        await api.post("/blog/admin", form);
      }
      setShowForm(false);
      setForm(BLANK);
      setEditingId(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save the post.");
    } finally {
      setFormBusy(false);
    }
  };

  const togglePublish = async (post) => {
    try {
      await api.put(`/blog/admin/${post._id}`, { isPublished: !post.isPublished });
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, isPublished: !post.isPublished } : p))
      );
    } catch {
      alert("Could not update the post. Please try again.");
    }
  };

  const toggleFeatured = async (post) => {
    try {
      await api.put(`/blog/admin/${post._id}`, { isFeatured: !post.isFeatured });
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, isFeatured: !post.isFeatured } : p))
      );
    } catch {
      alert("Could not update the post. Please try again.");
    }
  };

  const handleDelete = async (post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/blog/admin/${post._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
    } catch {
      alert("Could not delete the post. Please try again.");
    }
  };

  const publishedCount = posts.filter((p) => p.isPublished).length;

  if (fetchError)
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-zinc-200 p-8 text-center max-w-sm w-full rounded-lg">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-black text-zinc-900 mb-1">Failed to load posts</h2>
          <p className="text-xs text-zinc-500 mb-5">Check that the backend is running and retry.</p>
          <button
            onClick={load}
            className="flex items-center justify-center gap-2 w-full bg-black text-white px-5 py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors rounded-lg"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f7f8] pb-20 font-sans selection:bg-black selection:text-white">
      {/* ── Dark header ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white pb-12">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative px-6 md:px-12 py-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">
              Content &amp; SEO
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Blog Management
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Publish guides that rank on Google and bring customers to your services.
            </p>
          </div>
          <button
            onClick={() => (showForm ? setShowForm(false) : openCreate())}
            className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-colors rounded-lg shrink-0 ${
              showForm
                ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            {showForm ? (<><X size={11} /> Cancel</>) : (<><Plus size={11} /> Write a Post</>)}
          </button>
        </div>
      </div>

      <div className="px-6 md:px-12 -mt-8 max-w-7xl mx-auto space-y-5 relative z-10">
        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Posts", value: posts.length, sub: "All time" },
            { label: "Published", value: publishedCount, sub: "Live on the blog" },
            { label: "Drafts", value: posts.length - publishedCount, sub: "Hidden from readers" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-100 p-5 rounded-lg">
              <p className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight mb-0.5">{s.value}</p>
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{s.label}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Editor form ───────────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-base font-black text-zinc-900">
                  {editingId ? "Edit Post" : "New Post"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Use ## for headings, - for bullet lists, &gt; for a highlight quote, **text** for bold.
                </p>
              </div>
              <Newspaper size={18} className="text-zinc-200 shrink-0 mt-0.5" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="AC Service Checklist: 9 Signs Your AC Needs Servicing"
                    value={form.title}
                    onChange={set("title")}
                    maxLength={120}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">The URL slug is generated automatically.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={set("category")}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                  Excerpt * <span className="normal-case font-medium">(shown on cards and in Google results)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="One or two sentences that make someone want to read this."
                  value={form.excerpt}
                  onChange={set("excerpt")}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors resize-y"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                  Cover Image
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 mb-2">
                  {COVER_PRESETS.map((src) => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => setForm((f) => ({ ...f, coverImage: src }))}
                      className={`relative aspect-[4/3] rounded-md overflow-hidden border-2 transition-all ${
                        form.coverImage === src ? "border-black" : "border-transparent hover:border-zinc-300"
                      }`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="…or paste an image URL"
                  value={form.coverImage}
                  onChange={set("coverImage")}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-xs font-mono text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                  Content *
                </label>
                <textarea
                  rows={14}
                  placeholder={"Intro paragraph…\n\n## First heading\n\nParagraph text with **bold** where it matters.\n\n- Bullet one\n- Bullet two\n\n> A pull-quote or key takeaway."}
                  value={form.content}
                  onChange={set("content")}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm leading-6 text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors resize-y font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Tags <span className="normal-case font-medium">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="AC service, maintenance, summer"
                    value={form.tags}
                    onChange={set("tags")}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Author Name <span className="normal-case font-medium">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="EliteCrew Team"
                    value={form.authorName}
                    onChange={set("authorName")}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} className="h-4 w-4 accent-black" />
                  Published (visible on the blog)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={set("isFeatured")} className="h-4 w-4 accent-black" />
                  Featured (large card at the top)
                </label>
              </div>

              {formError && (
                <p className="flex items-center gap-2 text-xs font-semibold text-red-600">
                  <AlertCircle size={13} /> {formError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={formBusy}
                  className="bg-black text-white px-6 py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {formBusy ? "Saving…" : editingId ? "Save Changes" : "Publish Post"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-zinc-200 text-zinc-600 px-6 py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-lg hover:border-zinc-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Post list ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center text-xs text-zinc-400 font-semibold">
            Loading posts…
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white border border-zinc-200 rounded-lg p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <img
                  src={post.coverImage}
                  alt=""
                  className="h-20 w-32 rounded-md object-cover border border-zinc-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-black text-zinc-900 truncate">{post.title}</h3>
                    {post.isFeatured && (
                      <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border bg-[#fbf8f2] text-[#8a6d33] border-[#e8dcc3]">
                        Featured
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                        post.isPublished
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-zinc-100 text-zinc-500 border-zinc-200"
                      }`}
                    >
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>{post.category}</span>
                    <span>·</span>
                    <span>/blog/{post.slug}</span>
                    <span>·</span>
                    <span>{post.readMinutes} min read</span>
                    <span>·</span>
                    <span>{fmtDate(post.createdAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View post"
                    className="p-2.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-black hover:text-black transition-colors"
                  >
                    <Eye size={13} />
                  </a>
                  <button
                    onClick={() => toggleFeatured(post)}
                    title={post.isFeatured ? "Remove from featured" : "Make featured"}
                    className={`p-2.5 border rounded-lg transition-colors ${
                      post.isFeatured
                        ? "border-[#e8dcc3] text-[#8a6d33] bg-[#fbf8f2]"
                        : "border-zinc-200 text-zinc-400 hover:border-[#C8A45C] hover:text-[#8a6d33]"
                    }`}
                  >
                    <Star size={13} />
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    title="Edit"
                    className="p-2.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-black hover:text-black transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => togglePublish(post)}
                    title={post.isPublished ? "Unpublish (hide)" : "Publish"}
                    className="p-2.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
                  >
                    {post.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(post)}
                    title="Delete"
                    className="p-2.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
