"use client";

// Same-tab signal that tells <AdminSidebar> to refetch its badge counts right
// now, instead of waiting for the next poll/route-change. Call this after any
// action that "reads" pending items — opening a list, opening a ticket, etc.
export const ADMIN_BADGES_REFRESH_EVENT = "admin:badges:refresh";

export function refreshAdminBadges() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_BADGES_REFRESH_EVENT));
  }
}
