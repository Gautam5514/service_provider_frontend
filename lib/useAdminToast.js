"use client";

import { useCallback, useState } from "react";

// Shared toast state for admin pages — pairs with <AdminToast />.
// A second showToast() call while one is visible simply replaces it (its
// `key` changes so the display timer restarts), so callers never need to
// worry about stacking or dismissing a previous toast first.
export function useAdminToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, opts = {}) => {
    const { ok = true } = opts;
    setToast({ message, ok, key: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, showToast, dismissToast };
}
