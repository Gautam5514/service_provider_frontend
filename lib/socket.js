"use client";

import { io } from "socket.io-client";
import { getWsToken } from "@/lib/auth";

let socket = null;

// ─── Private helpers ───────────────────────────────────────────────────────────

async function fetchAndCacheWsToken() {
  try {
    const res = await fetch("/api/auth/ws-token", { credentials: "include" });
    if (!res.ok) return null;
    const { wsToken } = await res.json();
    if (wsToken) sessionStorage.setItem("wsToken", wsToken);
    return wsToken || null;
  } catch {
    return null;
  }
}

function buildSocket(wsToken) {
  if (socket) return socket; // already created — reuse

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5050", {
    auth:            { token: wsToken },
    withCredentials: true,
    transports:      ["websocket", "polling"],
    autoConnect:     true,
  });

  // Auto-refresh expired ws-token
  socket.on("connect_error", async (err) => {
    const isAuthError =
      err.message?.toLowerCase().includes("auth") ||
      err.message?.toLowerCase().includes("token");

    if (isAuthError) {
      const fresh = await fetchAndCacheWsToken();
      if (fresh) {
        socket.auth = { token: fresh };
        socket.connect();
      }
    }
  });

  return socket;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * getSocket() — SYNCHRONOUS.
 *
 * Returns the socket if a wsToken is already in sessionStorage (covers all
 * page-refresh and same-tab scenarios). Returns null if no token is cached.
 *
 * Safe to call anywhere without await.
 */
export function getSocket() {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  const wsToken = getWsToken(); // reads sessionStorage — instant, no network
  if (!wsToken) return null;

  return buildSocket(wsToken);
}

/**
 * ensureSocket() — ASYNC.
 *
 * Use when you can't be certain the token is already cached (new browser tab,
 * first load after cookie-only login). Fetches a fresh ws-token from the
 * httpOnly cookie session if sessionStorage is empty, then builds the socket.
 */
export async function ensureSocket() {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  let wsToken = getWsToken();
  if (!wsToken) wsToken = await fetchAndCacheWsToken();
  if (!wsToken) return null;

  return buildSocket(wsToken);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
