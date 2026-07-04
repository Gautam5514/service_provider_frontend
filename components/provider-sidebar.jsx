"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getStoredUser, performLogout } from "@/lib/auth";
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
  ClipboardList,
  UserCircle2,
  CheckCircle2,
  LogOut,
  Store,
} from "lucide-react";

const navItems = [
  { name: "Overview",  href: "/dashboard/provider",           icon: LayoutDashboard  },
  { name: "Orders",    href: "/dashboard/provider/orders",    icon: ClipboardList    },
  { name: "Profile",   href: "/dashboard/provider/profile",   icon: UserCircle2      },
  { name: "Completed", href: "/dashboard/provider/completed", icon: CheckCircle2     },
];

export function ProviderSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    performLogout().then(() => router.push("/login"));
  };

  const initials = (user?.fullName || "P")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";

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
            Partner
          </span>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="pt-4 pb-2">
        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard/provider" && pathname.startsWith(item.href));
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
                      <span className="text-[13px]">{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 pb-6 gap-2">
        <SidebarSeparator className="bg-white/[0.06] mb-2" />
        
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm border border-white/10">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-semibold text-white truncate leading-tight">
                {user.fullName || "Partner"}
              </span>
              <span className="text-[10px] text-zinc-400 truncate leading-none mt-0.5">
                {user.email || "partner@elitecrew.com"}
              </span>
            </div>
          </div>
        )}

        <SidebarMenu className="mt-1 gap-1.5">
          {/* Cross-link to the customer site — book a service or register as a customer */}
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              tooltip="Register as a Customer"
              className="rounded-lg text-zinc-400 hover:!bg-white/[0.07] hover:!text-white transition-colors h-10 px-3"
            >
              <Store size={16} strokeWidth={1.8} className="mr-1.5 shrink-0" />
              <span className="text-[13px]">Register as a Customer</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
