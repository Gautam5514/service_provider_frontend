"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import {
  AlertCircle,
  Briefcase,
  ChevronDown,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  PowerOff,
  Power,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = ["Engineering", "Design", "Operations", "Marketing", "Support", "Finance", "Other"];
const JOB_TYPES = [
  ["full_time", "Full-time"],
  ["part_time", "Part-time"],
  ["contract", "Contract"],
  ["internship", "Internship"],
];
const TYPE_LABEL = Object.fromEntries(JOB_TYPES);

const APP_STATUSES = [
  ["new",         "New",         "bg-sky-50 text-sky-700 border-sky-200"],
  ["shortlisted", "Shortlisted", "bg-amber-50 text-amber-700 border-amber-200"],
  ["hired",       "Hired",       "bg-emerald-50 text-emerald-700 border-emerald-200"],
  ["rejected",    "Rejected",    "bg-red-50 text-red-600 border-red-200"],
];

const BLANK = {
  title: "",
  department: "Engineering",
  location: "",
  type: "full_time",
  experience: "",
  salaryRange: "",
  summary: "",
  responsibilities: "",
  requirements: "",
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AdminCareersPage() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");

  // applications panel
  const [openAppsFor, setOpenAppsFor] = useState(null);
  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data } = await api.get("/careers/admin");
      setCareers(data.careers || []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── form open helpers ───────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(BLANK);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (job) => {
    setEditingId(job._id);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      experience: job.experience || "",
      salaryRange: job.salaryRange || "",
      summary: job.summary,
      responsibilities: (job.responsibilities || []).join("\n"),
      requirements: (job.requirements || []).join("\n"),
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── create / update ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim())    return setFormError("Job title is required.");
    if (!form.location.trim()) return setFormError("Location is required.");
    if (!form.summary.trim())  return setFormError("A short role summary is required.");

    setFormBusy(true);
    try {
      if (editingId) {
        await api.put(`/careers/admin/${editingId}`, form);
      } else {
        await api.post("/careers/admin", form);
      }
      setShowForm(false);
      setForm(BLANK);
      setEditingId(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save the job posting.");
    } finally {
      setFormBusy(false);
    }
  };

  // ── open/close toggle ───────────────────────────────────────────────────────
  const toggleOpen = async (job) => {
    try {
      await api.put(`/careers/admin/${job._id}`, { isOpen: !job.isOpen });
      setCareers((prev) =>
        prev.map((c) => (c._id === job._id ? { ...c, isOpen: !job.isOpen } : c))
      );
    } catch {
      alert("Could not update the job status. Please try again.");
    }
  };

  // ── delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (job) => {
    if (!confirm(`Delete "${job.title}" and all its applications? This cannot be undone.`)) return;
    try {
      await api.delete(`/careers/admin/${job._id}`);
      setCareers((prev) => prev.filter((c) => c._id !== job._id));
      if (openAppsFor === job._id) setOpenAppsFor(null);
    } catch {
      alert("Could not delete the job posting. Please try again.");
    }
  };

  // ── applications ────────────────────────────────────────────────────────────
  const toggleApps = async (jobId) => {
    if (openAppsFor === jobId) return setOpenAppsFor(null);
    setOpenAppsFor(jobId);
    setApps([]);
    setAppsLoading(true);
    try {
      const { data } = await api.get(`/careers/admin/${jobId}/applications`);
      setApps(data.applications || []);
    } catch {
      setApps([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const setAppStatus = async (appId, status) => {
    try {
      await api.put(`/careers/admin/applications/${appId}/status`, { status });
      setApps((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
    } catch {
      alert("Could not update the applicant status.");
    }
  };

  // ── derived ─────────────────────────────────────────────────────────────────
  const openCount = careers.filter((c) => c.isOpen).length;
  const totalApps = careers.reduce((s, c) => s + (c.applicationCount || 0), 0);

  // ── error screen ────────────────────────────────────────────────────────────
  if (fetchError)
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-zinc-200 p-8 text-center max-w-sm w-full rounded-lg">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-black text-zinc-900 mb-1">Failed to load careers</h2>
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
              Hiring &amp; Recruitment
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Careers Management
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Publish job openings, review applicants, and manage your hiring pipeline.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => (showForm ? setShowForm(false) : openCreate())}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-colors rounded-lg ${
                showForm
                  ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                  : "bg-white text-black hover:bg-zinc-100"
              }`}
            >
              {showForm ? (<><X size={11} /> Cancel</>) : (<><Plus size={11} /> Post a Job</>)}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 -mt-8 max-w-7xl mx-auto space-y-5 relative z-10">
        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Roles", value: careers.length, sub: "All time posted" },
            { label: "Open Now", value: openCount, sub: "Accepting applications" },
            { label: "Applications", value: totalApps, sub: "Across all roles" },
            { label: "Closed", value: careers.length - openCount, sub: "Not visible on site" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-100 p-5 rounded-lg">
              <p className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight mb-0.5">
                {s.value}
              </p>
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{s.label}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Create / edit form ────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-base font-black text-zinc-900">
                  {editingId ? "Edit Job Posting" : "New Job Posting"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Fields marked * are required. It appears on the public careers page immediately.
                </p>
              </div>
              <Briefcase size={18} className="text-zinc-200 shrink-0 mt-0.5" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Software Engineer — Backend"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={90}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                      Department
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                      Job Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      {JOB_TYPES.map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Location *
                  </label>
                  <input
                    type="text"
                    placeholder="Remote · India / Noida, UP"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    maxLength={80}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Experience
                  </label>
                  <input
                    type="text"
                    placeholder="2–4 years"
                    value={form.experience}
                    onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                    maxLength={40}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    placeholder="₹8–14 LPA (optional)"
                    value={form.salaryRange}
                    onChange={(e) => setForm((f) => ({ ...f, salaryRange: e.target.value }))}
                    maxLength={60}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                  Role Summary *
                </label>
                <textarea
                  rows={2}
                  placeholder="One or two sentences describing the role and what makes it exciting."
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  maxLength={500}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Responsibilities <span className="normal-case font-medium">(one per line)</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder={"Design and build backend services\nOwn features end to end\nWork with the product team"}
                    value={form.responsibilities}
                    onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    Requirements <span className="normal-case font-medium">(one per line)</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder={"2+ years with Node.js and MongoDB\nStrong API design fundamentals\nComfortable in a fast-moving startup"}
                    value={form.requirements}
                    onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-zinc-300 focus:outline-none focus:border-black transition-colors resize-y"
                  />
                </div>
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
                  {formBusy ? "Saving…" : editingId ? "Save Changes" : "Publish Job"}
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

        {/* ── Job list ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center text-xs text-zinc-400 font-semibold">
            Loading job postings…
          </div>
        ) : careers.length === 0 ? (
          <div className="bg-white border border-zinc-100 rounded-lg p-14 text-center">
            <Briefcase size={26} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-black text-zinc-900 mb-1">No job postings yet</p>
            <p className="text-xs text-zinc-400">
              Click &ldquo;Post a Job&rdquo; to publish your first opening on the careers page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {careers.map((job) => (
              <div key={job._id} className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-[15px] font-black text-zinc-900 truncate">{job.title}</h3>
                      <span
                        className={`text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                          job.isOpen
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {job.isOpen ? "Open" : "Closed"}
                      </span>
                      <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border bg-zinc-50 text-zinc-500 border-zinc-200">
                        {job.department}
                      </span>
                    </div>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                      <span>{TYPE_LABEL[job.type]}</span>
                      {job.experience && <span>{job.experience}</span>}
                      {job.salaryRange && <span>{job.salaryRange}</span>}
                      <span className="text-zinc-400">Posted {fmtDate(job.createdAt)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => toggleApps(job._id)}
                      className="inline-flex items-center gap-1.5 border border-zinc-200 px-3.5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase text-zinc-700 hover:border-black transition-colors"
                    >
                      <Users size={12} />
                      {job.applicationCount || 0} Applicant{(job.applicationCount || 0) === 1 ? "" : "s"}
                      <ChevronDown
                        size={12}
                        className={`transition-transform ${openAppsFor === job._id ? "rotate-180" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => openEdit(job)}
                      title="Edit"
                      className="p-2.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-black hover:text-black transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => toggleOpen(job)}
                      title={job.isOpen ? "Close applications" : "Reopen applications"}
                      className={`p-2.5 border rounded-lg transition-colors ${
                        job.isOpen
                          ? "border-zinc-200 text-zinc-500 hover:border-amber-400 hover:text-amber-600"
                          : "border-emerald-200 text-emerald-600 hover:border-emerald-400"
                      }`}
                    >
                      {job.isOpen ? <PowerOff size={13} /> : <Power size={13} />}
                    </button>
                    <button
                      onClick={() => handleDelete(job)}
                      title="Delete"
                      className="p-2.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ── Applications panel ────────────────────────────────── */}
                {openAppsFor === job._id && (
                  <div className="border-t border-zinc-100 bg-[#fafafa] p-5 md:p-6">
                    {appsLoading ? (
                      <p className="text-xs text-zinc-400 font-semibold">Loading applications…</p>
                    ) : apps.length === 0 ? (
                      <p className="text-xs text-zinc-400 font-semibold">
                        No applications for this role yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {apps.map((a) => {
                          const st = APP_STATUSES.find(([v]) => v === a.status) || APP_STATUSES[0];
                          return (
                            <div
                              key={a._id}
                              className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="text-sm font-black text-zinc-900">{a.name}</p>
                                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${st[2]}`}>
                                    {st[1]}
                                  </span>
                                  <span className="text-[10px] text-zinc-400">{fmtDate(a.createdAt)}</span>
                                </div>
                                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                                  <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1 hover:text-black">
                                    <Mail size={11} /> {a.email}
                                  </a>
                                  <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 hover:text-black">
                                    <Phone size={11} /> {a.phone}
                                  </a>
                                  {a.portfolio && (
                                    <a
                                      href={a.portfolio}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800"
                                    >
                                      <ExternalLink size={11} /> Portfolio
                                    </a>
                                  )}
                                  {a.resumeUrl && (
                                    <a
                                      href={a.resumeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800"
                                    >
                                      <ExternalLink size={11} /> Resume
                                    </a>
                                  )}
                                </p>
                                {a.coverNote && (
                                  <p className="mt-2 text-xs text-zinc-600 leading-5 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2">
                                    {a.coverNote}
                                  </p>
                                )}
                              </div>
                              <select
                                value={a.status}
                                onChange={(e) => setAppStatus(a._id, e.target.value)}
                                className="border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold text-zinc-700 bg-white focus:outline-none focus:border-black transition-colors flex-shrink-0"
                              >
                                {APP_STATUSES.map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
