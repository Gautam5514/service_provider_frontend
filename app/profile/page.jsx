"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  getDashboardPath, performLogout, saveAuthSession, validateSession,
} from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";
import {
  ArrowLeft, BadgeCheck, Briefcase, CalendarDays, Check, ChevronRight,
  Home, KeyRound, Loader2, LogOut, MapPin, MessageSquare,
  Plus, Star, Trash2, UserRound, X,
} from "lucide-react";

const inputCls =
  "w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-black focus:ring-4 focus:ring-black/[0.06] transition-all placeholder:text-zinc-400 placeholder:font-normal disabled:bg-zinc-50 disabled:text-zinc-400";

const LABEL_OPTIONS = ["Home", "Work", "Other"];

function SectionCard({ id, eyebrow, title, desc, children }) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm scroll-mt-24">
      <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 mb-1">{eyebrow}</p>
        <h2 className="text-lg font-black text-zinc-900 tracking-tight">{title}</h2>
        {desc && <p className="text-[13px] text-zinc-500 mt-1">{desc}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [user,      setUser]      = useState(null);
  const [ready,     setReady]     = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [bookings,  setBookings]  = useState([]);

  // ── Profile form state ──
  const [formName,  setFormName]  = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState(null); // { ok, text }

  // ── Address form state ──
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: "Home", fullAddress: "", city: "", pincode: "", isDefault: false });
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrErr, setAddrErr] = useState("");
  const [addrBusyId, setAddrBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    validateSession().then((verified) => {
      if (cancelled) return;
      if (!verified) { router.replace("/login"); return; }
      if (verified.role !== "customer") { router.replace(getDashboardPath(verified.role)); return; }
      setUser(verified);
      setFormName(verified.fullName || "");
      setFormPhone(verified.phone || "");
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    api.get("/addresses").then(({ data }) => {
      if (data.success) setAddresses(data.addresses || []);
    }).catch(() => {});
    api.get("/bookings/my").then(({ data }) => {
      if (data.success) setBookings(data.bookings || []);
    }).catch(() => {});
  }, [ready]);

  const logout = () => { performLogout().then(() => router.push("/login")); };

  // ── Derived ──
  const initials = (user?.fullName || "C")
    .split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;
  const completedCount = bookings.filter(b => b.status === "completed").length;
  const activeCount    = bookings.filter(b => !["completed", "cancelled"].includes(b.status)).length;

  const profileDirty =
    user && (formName.trim() !== (user.fullName || "") || formPhone.trim() !== (user.phone || ""));

  // ── Save profile ──
  const saveProfile = async () => {
    setSaveMsg(null);
    const payload = {};
    if (formName.trim()  !== (user.fullName || "")) payload.fullName = formName.trim();
    if (formPhone.trim() !== (user.phone || ""))    payload.phone    = formPhone.trim();
    if (!Object.keys(payload).length) return;

    setSaving(true);
    try {
      const { data } = await api.put("/auth/me", payload);
      if (data.success) {
        setUser(data.user);
        saveAuthSession({ user: data.user });
        setSaveMsg({ ok: true, text: "Profile updated successfully." });
      }
    } catch (err) {
      setSaveMsg({ ok: false, text: err.response?.data?.message || "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ── Addresses ──
  const addAddress = async () => {
    setAddrErr("");
    if (!addrForm.fullAddress.trim() || !addrForm.city.trim()) {
      setAddrErr("Address and city are required.");
      return;
    }
    setAddrSaving(true);
    try {
      const { data } = await api.post("/addresses", addrForm);
      if (data.success) {
        const { data: fresh } = await api.get("/addresses");
        if (fresh.success) setAddresses(fresh.addresses || []);
        setShowAddrForm(false);
        setAddrForm({ label: "Home", fullAddress: "", city: "", pincode: "", isDefault: false });
      }
    } catch (err) {
      setAddrErr(err.response?.data?.message || "Could not save address.");
    } finally {
      setAddrSaving(false);
    }
  };

  const setDefaultAddress = async (id) => {
    setAddrBusyId(id);
    try {
      const { data } = await api.put(`/addresses/${id}/default`);
      if (data.success) {
        setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
      }
    } catch { /* leave list untouched */ }
    finally { setAddrBusyId(null); }
  };

  const deleteAddress = async (id) => {
    setAddrBusyId(id);
    try {
      const { data } = await api.delete(`/addresses/${id}`);
      if (data.success) setAddresses(prev => prev.filter(a => a._id !== id));
    } catch { /* leave list untouched */ }
    finally { setAddrBusyId(null); }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] font-sans selection:bg-black selection:text-white pb-20">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 md:px-8 h-16 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-black transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-transparent.png" alt="EliteCrew" className="w-6 h-6 object-contain" />
            <span className="text-base font-extrabold tracking-tight text-black">
              Elite<span className="font-light text-zinc-500">Crew</span>
            </span>
          </Link>
          <span className="hidden sm:inline text-zinc-200">|</span>
          <span className="hidden sm:block text-[10px] font-bold tracking-widest uppercase text-zinc-500">My Account</span>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell variant="light" />
          </div>
        </div>
      </nav>

      {/* ── Identity header ── */}
      <div className="bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 shadow-lg flex items-center justify-center text-xl md:text-2xl font-black shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight truncate">{user.fullName}</h1>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.18em] uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full">
                  <BadgeCheck size={11} /> Verified Customer
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1 truncate">{user.email}</p>
              {memberSince && (
                <p className="text-[11px] text-zinc-500 mt-0.5">Member since {memberSince}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-8 max-w-md">
            {[
              { label: "Active",    value: activeCount },
              { label: "Completed", value: completedCount },
              { label: "Addresses", value: addresses.length },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-5 md:px-8 mt-8 grid lg:grid-cols-[220px_1fr] gap-8 items-start">

        {/* Section nav (desktop) */}
        <aside className="hidden lg:block sticky top-24 space-y-1">
          {[
            { label: "Personal Details", href: "#profile",   Icon: UserRound },
            { label: "Saved Addresses",  href: "#addresses", Icon: MapPin },
            { label: "Settings",         href: "#settings",  Icon: KeyRound },
          ].map(({ label, href, Icon }) => (
            <a key={href} href={href}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-500 hover:text-black hover:bg-white transition-colors">
              <Icon size={15} strokeWidth={1.9} className="text-zinc-400" />
              {label}
            </a>
          ))}
          <div className="pt-3 mt-3 border-t border-zinc-200/70 space-y-1">
            <Link href="/bookings"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-500 hover:text-black hover:bg-white transition-colors">
              <CalendarDays size={15} strokeWidth={1.9} className="text-zinc-400" /> My Bookings
            </Link>
            <Link href="/providers"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-500 hover:text-black hover:bg-white transition-colors">
              <Briefcase size={15} strokeWidth={1.9} className="text-zinc-400" /> Browse Professionals
            </Link>
          </div>
        </aside>

        {/* Cards */}
        <div className="space-y-6 min-w-0">

          {/* ── Personal details ── */}
          <SectionCard
            id="profile"
            eyebrow="Account"
            title="Personal Details"
            desc="Your name and phone are used on every booking and shared with the assigned professional."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-400 mb-1.5">Full Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  className={inputCls} placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-400 mb-1.5">Phone</label>
                <input value={formPhone} onChange={e => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric" className={inputCls} placeholder="10-digit mobile number" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-400 mb-1.5">Email</label>
                <div className="relative">
                  <input value={user.email} disabled className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    <BadgeCheck size={10} /> Verified
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">Email is your sign-in ID and can&rsquo;t be changed.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-5">
              <button
                onClick={saveProfile}
                disabled={!profileDirty || saving}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Changes
              </button>
              {saveMsg && (
                <p className={`text-xs font-semibold ${saveMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {saveMsg.text}
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── Addresses ── */}
          <SectionCard
            id="addresses"
            eyebrow="Locations"
            title="Saved Addresses"
            desc="Your default address is pre-filled at checkout. You can save up to 5."
          >
            {addresses.length === 0 && !showAddrForm && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3">
                  <MapPin size={18} className="text-zinc-400" />
                </div>
                <p className="text-sm font-bold text-zinc-700">No saved addresses yet</p>
                <p className="text-xs text-zinc-400 mt-1">Add one to speed up your next booking.</p>
              </div>
            )}

            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={addr._id}
                  className={`flex items-start gap-3.5 rounded-xl border p-4 transition-colors ${
                    addr.isDefault ? "border-zinc-900 bg-zinc-50/60" : "border-zinc-150 bg-white hover:border-zinc-300"
                  }`}>
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                    {addr.label === "Work"
                      ? <Briefcase size={15} className="text-zinc-500" />
                      : <Home size={15} className="text-zinc-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-extrabold text-zinc-900">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.18em] uppercase bg-black text-white px-1.5 py-0.5 rounded-full">
                          <Star size={8} className="fill-current" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-zinc-600 mt-0.5 leading-relaxed">{addr.fullAddress}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {addr.city}{addr.pincode ? ` — ${addr.pincode}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefaultAddress(addr._id)}
                        disabled={addrBusyId === addr._id}
                        title="Make default"
                        className="text-[10px] font-bold tracking-wide uppercase text-zinc-400 hover:text-black border border-zinc-200 hover:border-zinc-400 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40">
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => deleteAddress(addr._id)}
                      disabled={addrBusyId === addr._id}
                      title="Delete address"
                      className="text-zinc-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add address */}
            {showAddrForm ? (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500">New Address</p>
                  <button onClick={() => { setShowAddrForm(false); setAddrErr(""); }}
                    className="text-zinc-400 hover:text-black p-1 rounded-md hover:bg-zinc-100 transition-colors">
                    <X size={15} />
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  {LABEL_OPTIONS.map(l => (
                    <button key={l} type="button"
                      onClick={() => setAddrForm(f => ({ ...f, label: l }))}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase border transition-colors ${
                        addrForm.label === l
                          ? "bg-black text-white border-black"
                          : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <textarea rows={2} value={addrForm.fullAddress}
                      onChange={e => setAddrForm(f => ({ ...f, fullAddress: e.target.value }))}
                      className={`${inputCls} resize-none`} placeholder="House / flat, street, landmark…" />
                  </div>
                  <input value={addrForm.city}
                    onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))}
                    className={inputCls} placeholder="City" />
                  <input value={addrForm.pincode}
                    onChange={e => setAddrForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                    inputMode="numeric" className={inputCls} placeholder="Pincode (optional)" />
                </div>

                <label className="flex items-center gap-2 mt-3.5 cursor-pointer select-none">
                  <input type="checkbox" checked={addrForm.isDefault}
                    onChange={e => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-300 accent-black" />
                  <span className="text-xs font-semibold text-zinc-600">Set as default address</span>
                </label>

                {addrErr && <p className="text-xs font-semibold text-red-500 mt-3">{addrErr}</p>}

                <button onClick={addAddress} disabled={addrSaving}
                  className="mt-4 inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:opacity-40">
                  {addrSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Save Address
                </button>
              </div>
            ) : (
              addresses.length < 5 && (
                <button onClick={() => setShowAddrForm(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-3.5 text-[11px] font-bold tracking-widest uppercase text-zinc-500 hover:border-black hover:text-black transition-colors">
                  <Plus size={14} /> Add New Address
                </button>
              )
            )}
          </SectionCard>

          {/* ── Settings ── */}
          <SectionCard
            id="settings"
            eyebrow="Security & Preferences"
            title="Settings"
          >
            <div className="divide-y divide-zinc-100 -my-2">
              <Link href="/forgot-password"
                className="flex items-center gap-4 py-4 group">
                <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                  <KeyRound size={15} className="text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">Change Password</p>
                  <p className="text-xs text-zinc-400 mt-0.5">We&rsquo;ll send a one-time code to your email to reset it.</p>
                </div>
                <ChevronRight size={16} className="text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link href="/bookings"
                className="flex items-center gap-4 py-4 group">
                <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                  <CalendarDays size={15} className="text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">Booking History</p>
                  <p className="text-xs text-zinc-400 mt-0.5">All your past and active services, invoices, and live tracking.</p>
                </div>
                <ChevronRight size={16} className="text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link href="/support"
                className="flex items-center gap-4 py-4 group">
                <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                  <MessageSquare size={15} className="text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">Help &amp; Support</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Raise a ticket — our team replies within a few hours.</p>
                </div>
                <ChevronRight size={16} className="text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </Link>

              <button onClick={logout} className="w-full flex items-center gap-4 py-4 group text-left">
                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <LogOut size={15} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-500">Sign Out</p>
                  <p className="text-xs text-zinc-400 mt-0.5">You&rsquo;ll need to sign in again to book or track services.</p>
                </div>
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
