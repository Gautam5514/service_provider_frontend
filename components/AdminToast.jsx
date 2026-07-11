"use client";

import { useEffect } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

// Fixed top-right toast for admin pages — replaces jarring alert() calls.
// Pair with the useAdminToast() hook: const { toast, showToast, dismissToast } = useAdminToast();
export default function AdminToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onDismiss, 3500);
    return () => clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex items-start gap-3 max-w-sm w-[calc(100vw-2rem)] sm:w-auto px-4 py-3.5 rounded-lg border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        background: toast.ok ? "#ecfdf5" : "#fef2f2",
        borderColor: toast.ok ? "#a7f3d0" : "#fecaca",
      }}
    >
      {toast.ok ? (
        <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <XCircle size={17} className="text-red-600 shrink-0 mt-0.5" />
      )}
      <p className={`text-[13px] font-semibold leading-snug flex-1 ${toast.ok ? "text-emerald-800" : "text-red-800"}`}>
        {toast.message}
      </p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className={`shrink-0 p-0.5 rounded-md hover:bg-black/5 transition-colors ${toast.ok ? "text-emerald-500" : "text-red-500"}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
