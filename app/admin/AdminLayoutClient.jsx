"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, performLogout } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";
import SmartSearch from "@/components/SmartSearch";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, CheckCircle2, LogOut, MessageSquare, Wrench, Tag } from "lucide-react";

const navItems = [
  { name: "Dashboard",    href: "/admin",           icon: LayoutDashboard },
  { name: "Applications", href: "/admin/providers", icon: Users },
  { name: "Approved",     href: "/admin/approved",  icon: CheckCircle2 },
  { name: "Services",     href: "/admin/services",  icon: Wrench },
  { name: "Coupons",      href: "/admin/coupons",   icon: Tag },
  { name: "Support",      href: "/admin/support",   icon: MessageSquare },
];

const sectionLabel = (pathname) => {
  if (pathname.includes("/providers")) return "Providers";
  if (pathname.includes("/approved"))  return "Approved Providers";
  if (pathname.includes("/services"))  return "Services Catalog";
  if (pathname.includes("/coupons"))   return "Coupons";
  if (pathname.includes("/support"))   return "Support";
  return "Overview";
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setIsClient(true);
      const u = getStoredUser();
      if (!u || u.role !== "admin") router.replace("/login");
    }, 0);
    return () => clearTimeout(id);
  }, [router]);

  const handleLogout = () => {
    performLogout().then(() => router.push("/login"));
  };

  if (!isClient) return null;

  return (
    <SidebarProvider
      style={{
        "--sidebar":                    "#09090b",
        "--sidebar-foreground":         "#fafafa",
        "--sidebar-border":             "rgba(255,255,255,0.06)",
        "--sidebar-accent":             "rgba(255,255,255,0.06)",
        "--sidebar-accent-foreground":  "#a1a1aa",
        "--sidebar-primary":            "#ffffff",
        "--sidebar-primary-foreground": "#000000",
        "--sidebar-ring":               "rgba(255,255,255,0.2)",
      }}
      className="h-svh overflow-hidden bg-[#f7f7f8] text-black font-sans selection:bg-black selection:text-white"
    >
      {/* Desktop sidebar (hidden on mobile by shadcn internals) */}
      <AdminSidebar />

      {/* Main content */}
      <SidebarInset className="bg-[#f7f7f8] overflow-y-auto [scrollbar-gutter:stable]">

        {/* Desktop topbar */}
        <div className="hidden md:flex sticky top-0 z-30 h-16 shrink-0 items-center border-b border-zinc-100 bg-white/90 px-8 backdrop-blur-lg shadow-sm transition-all duration-200">
          {/* Left: Sidebar trigger & Title */}
          <div className="flex-1 flex items-center gap-4 justify-start min-w-[200px]">
            <SidebarTrigger className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl p-2 transition-all duration-200" />
            <div className="w-px h-5 bg-zinc-200" />
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-900">
                {sectionLabel(pathname)}
              </span>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 flex items-center justify-center">
            <SmartSearch role="admin" compact className="w-[360px]" />
          </div>

          {/* Right: Notifications */}
          <div className="flex-1 flex items-center justify-end gap-5 min-w-[200px]">
            <NotificationBell variant="light" />
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden bg-zinc-950 px-4 py-3 sticky top-0 z-30 shrink-0 space-y-3">
          <div className="h-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-transparent.png" alt="EliteCrew" className="w-6 h-6 object-contain brightness-0 invert" />
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
      </SidebarInset>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-white/[0.06]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}
                className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <item.icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
                <span className="text-[9px] font-bold tracking-wide">{item.name}</span>
              </Link>
            );
          })}
          <button onClick={handleLogout}
            className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={19} strokeWidth={1.8} />
            <span className="text-[9px] font-bold tracking-wide">Sign Out</span>
          </button>
        </div>
      </nav>
    </SidebarProvider>
  );
}
