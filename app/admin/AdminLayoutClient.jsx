"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getStoredUser, performLogout } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";
import SmartSearch from "@/components/SmartSearch";
import { LayoutDashboard, Users, CheckCircle2, LogOut, MessageSquare, Wrench, Tag, ChevronLeft, Menu } from "lucide-react";

const navItems = [
  { name: "Dashboard",    href: "/admin",           icon: LayoutDashboard },
  { name: "Applications", href: "/admin/providers", icon: Users },
  { name: "Approved",     href: "/admin/approved",  icon: CheckCircle2 },
  { name: "Services",     href: "/admin/services",  icon: Wrench },
  { name: "Coupons",      href: "/admin/coupons",   icon: Tag },
  { name: "Support",      href: "/admin/support",   icon: MessageSquare },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin-sidebar-collapsed") === "true";
    }
    return false;
  });

  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } }, []);
  const initials = (user?.fullName || "A").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const id = setTimeout(() => {
      setIsClient(true);
      const u = getStoredUser();
      if (!u || u.role !== "admin") {
        router.replace("/login");
      }
    }, 0);
    return () => clearTimeout(id);
  }, [router]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  const handleLogout = () => {
    performLogout().then(() => router.push("/login"));
  };

  if (!isClient) return null;

  return (
    <div className="flex h-screen bg-[#f7f7f8] text-black font-sans selection:bg-black selection:text-white">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`bg-zinc-950 flex flex-col hidden md:flex z-20 flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
        
        {/* Brand header */}
        <div className={`h-16 flex items-center border-b border-white/[0.06] flex-shrink-0 transition-all duration-300 ${isCollapsed ? "justify-center px-2" : "justify-between px-5"}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden animate-reveal-right">
                <img 
                  src="/logo-transparent.png" 
                  alt="EliteCrew" 
                  className="w-7 h-7 object-contain brightness-0 invert flex-shrink-0" 
                />
                <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
                  Elite<span className="text-zinc-500 font-light">Crew</span>
                  <span className="ml-2 text-[8px] font-bold tracking-[0.2em] uppercase bg-white/10 text-white/70 px-1.5 py-0.5 rounded">Admin</span>
                </span>
              </div>
              <button 
                onClick={toggleCollapse} 
                className="text-zinc-500 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg flex items-center justify-center"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft size={15} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <button 
              onClick={toggleCollapse} 
              className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-lg"
              aria-label="Expand Sidebar"
              title="Expand Sidebar"
            >
              <Menu size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
        
        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl text-[11px] font-bold tracking-wide transition-all duration-200 ${
                  isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-3 py-2.5"
                } ${
                  isActive 
                    ? "bg-white text-black shadow-sm" 
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
                }`}>
                <item.icon size={isCollapsed ? 17 : 15} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                {!isCollapsed && <span className="animate-reveal-right whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          {isCollapsed ? (
            <button onClick={handleLogout} title="Sign Out"
              className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150">
              <LogOut size={17} strokeWidth={1.8} />
            </button>
          ) : (
            <button onClick={handleLogout} 
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[11px] font-bold text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150">
              <LogOut size={15} strokeWidth={1.8} />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative min-w-0">
        <div className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-6 backdrop-blur-sm">
          {/* Left: Minimalistic Section Title */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-900">
              {pathname.includes("/providers") ? "Providers" : pathname.includes("/approved") ? "Approved Providers" : pathname.includes("/services") ? "Services Catalog" : pathname.includes("/coupons") ? "Coupons" : "Overview"}
            </span>
          </div>

          {/* Right: Small Search + Notification + Profile Avatar */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Smooth small search bar */}
            <SmartSearch role="admin" compact className="w-64" />

            {/* Notification Bell */}
            <NotificationBell variant="light" />

            {/* Divider */}
            <div className="w-px h-4 bg-zinc-200" />

            {/* Profile Avatar (Pure Right) */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm" title={user?.fullName || "Administrator"}>
              {initials}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-zinc-950 px-4 py-3 sticky top-0 z-30 space-y-3">
          <div className="h-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/logo-transparent.png" 
                alt="EliteCrew" 
                className="w-6 h-6 object-contain brightness-0 invert" 
              />
              <span className="text-sm font-black text-white tracking-tight">
                Elite<span className="text-zinc-500 font-light">Crew</span>
                <span className="ml-2 text-[8px] font-bold tracking-[0.2em] uppercase bg-white/10 text-white/70 px-1.5 py-0.5 rounded">Admin</span>
              </span>
            </div>
            <span className="text-zinc-400"><NotificationBell /></span>
          </div>
          <SmartSearch role="admin" />
        </div>

        <div className="pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-white/[0.06]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <item.icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
                <span className="text-[9px] font-bold tracking-wide">{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={19} strokeWidth={1.8} />
            <span className="text-[9px] font-bold tracking-wide">Sign Out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
