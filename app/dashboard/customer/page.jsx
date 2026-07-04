"use client";

// Legacy route — the customer "dashboard" is now the home page itself
// (search, book, track from the landing page; account lives at /profile).
// Kept as a redirect so old links and bookmarks keep working.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardPath, getStoredUser } from "@/lib/auth";

export default function CustomerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(getDashboardPath(user.role));
  }, [router]);

  return null;
}
