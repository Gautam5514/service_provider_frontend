"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredUser, performLogout } from "@/lib/auth";
import api from "@/lib/api";
import { getSocket, ensureSocket } from "@/lib/socket";
import { ADMIN_BADGES_REFRESH_EVENT } from "@/lib/adminBadges";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  LogOut,
  MessageSquare,
  Wrench,
  Tag,
  Briefcase,
  Inbox,
  Newspaper,
  Mail,
} from "lucide-react";

// `countKey` maps a nav item to the matching field in the /admin/badge-counts
// response — items without one (Dashboard, Approved, Services, ...) never
// carry a badge since there's nothing pending admin action there.
const navItems = [
  { name: "Dashboard",    href: "/admin",           icon: LayoutDashboard },
  { name: "Applications", href: "/admin/providers", icon: Users,          countKey: "applications" },
  { name: "Approved",     href: "/admin/approved",  icon: CheckCircle2 },
  { name: "Services",     href: "/admin/services",  icon: Wrench },
  { name: "Coupons",      href: "/admin/coupons",   icon: Tag },
  { name: "Careers",      href: "/admin/careers",   icon: Briefcase },
  { name: "Job Applicants", href: "/admin/careers/applications", icon: Inbox, countKey: "jobApplicants" },
  { name: "Blog",         href: "/admin/blog",      icon: Newspaper },
  { name: "Contact Messages", href: "/admin/contact", icon: Mail,         countKey: "contactMessages" },
  { name: "Support",      href: "/admin/support",   icon: MessageSquare, countKey: "support" },
];

// Socket events that mean "something admin needs to look at just landed" —
// any of these trigger a silent badge-count refetch.
const REFRESH_EVENTS = [
  "support:ticket:created",
  "support:message:new",
  "contact:message:new",
  "career:application:new",
  "provider:application:new",
];

// Some hrefs are nested inside another (e.g. "/admin/careers/applications"
// sits under "/admin/careers") — a plain per-item startsWith() check would
// light up both at once. Instead pick the single longest href that matches
// the current path, so only the most specific item is ever active.
function activeHrefFor(pathname) {
  let best = null;
  for (const item of navItems) {
    const matches =
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
    if (matches && (!best || item.href.length > best.length)) best = item.href;
  }
  return best;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/badge-counts");
      if (data.success) setCounts(data.counts || {});
    } catch {
      // Non-critical — badges just stay stale until the next successful fetch.
    }
  }, []);

  // Fetch on mount, on every route change (visiting a page often resolves
  // the items that were pending there), and on a slow poll as a safety net.
  useEffect(() => {
    loadCounts();
  }, [loadCounts, pathname]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadCounts();
    }, 60000);
    return () => clearInterval(id);
  }, [loadCounts]);

  // Instant same-tab refresh — pages dispatch this right after they mark
  // something as viewed (opening a list, opening a ticket, ...).
  useEffect(() => {
    window.addEventListener(ADMIN_BADGES_REFRESH_EVENT, loadCounts);
    return () => window.removeEventListener(ADMIN_BADGES_REFRESH_EVENT, loadCounts);
  }, [loadCounts]);

  // Real-time — refetch as soon as a customer/provider submits something
  // that needs admin attention.
  useEffect(() => {
    let mounted = true;
    let bound = null;

    async function setup() {
      let s = getSocket();
      if (!s) s = await ensureSocket();
      if (!s || !mounted) return;

      const handler = () => loadCounts();
      REFRESH_EVENTS.forEach((event) => s.on(event, handler));
      s.on("connect", handler);
      bound = { socket: s, handler };
    }

    setup();

    return () => {
      mounted = false;
      if (bound) {
        REFRESH_EVENTS.forEach((event) => bound.socket.off(event, bound.handler));
        bound.socket.off("connect", bound.handler);
      }
    };
  }, [loadCounts]);

  const activeHref = useMemo(() => activeHrefFor(pathname), [pathname]);

  const handleLogout = () => {
    performLogout().then(() => router.push("/login"));
  };

  const initials = (user?.fullName || "A")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "A";

  return (
    <Sidebar collapsible="icon" className="border-r-0">

      {/* Brand */}
      <SidebarHeader className="h-16 border-b border-white/[0.06] flex-row items-center gap-3 px-4">
        <img
          src="/logo-transparent.png"
          alt="EliteCrew"
          className="w-7 h-7 object-contain flex-shrink-0"
        />
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden overflow-hidden">
          <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
            Elite<span className="text-zinc-500 font-light">Crew</span>
          </span>
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase bg-white/10 text-white/60 px-1.5 py-0.5 rounded-md">
            Admin
          </span>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="pt-4 pb-2">
        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item) => {
                const isActive = item.href === activeHref;
                const count = item.countKey ? counts[item.countKey] || 0 : 0;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.name}
                      className={
                        isActive
                          ? "!bg-white !text-zinc-900 !font-semibold rounded-lg shadow-sm h-10 px-3 transition-all duration-200"
                          : "rounded-lg text-zinc-400 hover:!bg-white/[0.07] hover:!text-white h-10 px-3 transition-all duration-200"
                      }
                    >
                      <item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className="mr-1.5 shrink-0" />
                      <span className="text-[13px] flex-1">{item.name}</span>
                      {count > 0 && (
                        <span
                          className={`ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-black leading-none group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1 ${
                            isActive ? "bg-zinc-900 text-white" : "bg-amber-500 text-white"
                          }`}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer / User / Sign Out */}
      <SidebarFooter className="px-3 pb-6 gap-2">
        <SidebarSeparator className="bg-white/[0.06] mb-2" />
        
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm border border-white/10">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-semibold text-white truncate leading-tight">
                {user.fullName || "Admin"}
              </span>
              <span className="text-[10px] text-zinc-400 truncate leading-none mt-0.5">
                {user.email || "admin@elitecrew.com"}
              </span>
            </div>
          </div>
        )}

        <SidebarMenu className="mt-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign Out"
              className="rounded-lg text-zinc-500 hover:!bg-red-500/10 hover:!text-red-400 transition-colors h-10 px-3"
            >
              <LogOut size={16} strokeWidth={1.8} className="mr-1.5 shrink-0" />
              <span className="text-[13px]">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
