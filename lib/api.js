import axios from "axios";
import { clearAuthSession } from "@/lib/auth";

const api = axios.create({
  baseURL:          "/api",
  withCredentials:  true,  // Send the httpOnly auth cookie on every request
});

// No Bearer-token interceptor — the httpOnly cookie is forwarded automatically
// by the Next.js rewrite proxy, so the backend protect() middleware sees it.

// 401 response interceptor — clear stale user from localStorage when session expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/register")
    ) {
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);

export default api;
