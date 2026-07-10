// Auth session helpers
// Token is stored as an httpOnly cookie by the backend (not accessible to JS).
// Only the user object is kept in localStorage so the UI can render without
// an extra network round-trip after a page refresh.

// Fired whenever the locally-stored session changes (login, logout, role
// correction) so long-lived components — e.g. a widget mounted once in the
// root layout that never remounts on client-side navigation — can resync
// without needing a full page reload.
export const AUTH_CHANGED_EVENT = "elitecrew:auth-changed";

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function saveAuthSession({ user, wsToken }) {
  if (typeof window === "undefined") return;
  if (user)    localStorage.setItem("authUser",  JSON.stringify(user));
  if (wsToken) sessionStorage.setItem("wsToken", wsToken);
  notifyAuthChanged();
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("authUser") || "null"); }
  catch { return null; }
}

export function getWsToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("wsToken");
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("wsToken");
  notifyAuthChanged();
}

// Full logout: clears httpOnly cookie via backend, then wipes local state.
// Use this instead of calling clearAuthSession() directly.
export async function performLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // Ignore network errors — still clear local state
  }
  clearAuthSession();
}

export function getDashboardPath(role) {
  if (role === "admin")    return "/admin/providers";
  if (role === "provider") return "/dashboard/provider";
  // Customers land on the marketplace itself — the home page doubles as their
  // dashboard (search, book, track) with account actions in the navbar.
  return "/";
}

/**
 * Validates the httpOnly cookie session against the server and reconciles
 * localStorage with the server's authoritative user object.
 *
 * Returns the verified user on success, null if the session is invalid/expired,
 * or the cached localStorage user if the network request fails (offline / slow).
 *
 * Usage:
 *   const user = await validateSession();
 *   if (!user) { // session expired — redirect to login }
 */
export async function validateSession() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const data = await res.json();
    if (data.success && data.user) {
      // Overwrite localStorage with server-verified data so a user who manually
      // edited their role in DevTools gets corrected on the next page load.
      saveAuthSession({ user: data.user });
      return data.user;
    }
    // 401 or unexpected payload — session is gone
    clearAuthSession();
    return null;
  } catch {
    // Network error — fall back to the cached user so pages don't blank out
    // on a slow connection. The backend middleware still protects every API
    // call, so a stale localStorage role can only affect client-side UI.
    return getStoredUser();
  }
}
