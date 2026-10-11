import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5555/api";
console.log("[EMPMS API Client] Active Base URL:", API_BASE_URL);

// Helper function to read cookie value by name
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
};

// Helper function to set cookie on client
export const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
};

// Helper function to remove client cookie
export const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

// In-memory access token storage initialized from cookie or localStorage backup
let memoryAccessToken: string | null =
  typeof window !== "undefined"
    ? getCookie("accessToken") || localStorage.getItem("empms_access_token")
    : null;

let memoryRefreshToken: string | null =
  typeof window !== "undefined"
    ? getCookie("refreshToken") || localStorage.getItem("empms_refresh_token")
    : null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      setCookie("accessToken", token, 15 * 60); // 15 minutes
      localStorage.setItem("empms_access_token", token);
    } else {
      removeCookie("accessToken");
      localStorage.removeItem("empms_access_token");
    }
  }
};

export const setRefreshToken = (token: string | null) => {
  memoryRefreshToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      // If refreshToken is sent in response body, keep client cookie / storage updated
      setCookie("refreshToken", token, 7 * 24 * 60 * 60); // 7 days
      localStorage.setItem("empms_refresh_token", token);
    } else {
      removeCookie("refreshToken");
      localStorage.removeItem("empms_refresh_token");
    }
  }
};

export const setAuthTokens = (accessToken: string | null, refreshToken?: string | null) => {
  setAccessToken(accessToken);
  if (refreshToken !== undefined) {
    setRefreshToken(refreshToken);
  }
};

export const clearAuthTokens = () => {
  setAccessToken(null);
  setRefreshToken(null);
};

export const getAccessToken = (): string | null => {
  if (memoryAccessToken) return memoryAccessToken;
  if (typeof window !== "undefined") {
    const fromCookie = getCookie("accessToken");
    if (fromCookie) {
      memoryAccessToken = fromCookie;
      return fromCookie;
    }
    const fromStorage = localStorage.getItem("empms_access_token");
    if (fromStorage) {
      memoryAccessToken = fromStorage;
      return fromStorage;
    }
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (memoryRefreshToken) return memoryRefreshToken;
  if (typeof window !== "undefined") {
    const fromCookie = getCookie("refreshToken");
    if (fromCookie) {
      memoryRefreshToken = fromCookie;
      return fromCookie;
    }
    const fromStorage = localStorage.getItem("empms_refresh_token");
    if (fromStorage) {
      memoryRefreshToken = fromStorage;
      return fromStorage;
    }
  }
  return null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enables cookie passing for refresh and access tokens
});

// Request interceptor: attach current access token from storage/cookie
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency handling for refresh token rotation (single-flight queue)
let isRefreshing = false;
let isLoggingOut = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle automatic token refresh and transparent retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Detect if this is an authentication error (401)
    // Only attempt refresh if:
    // 1. It is a 401 response
    // 2. Request configuration exists and has not already been retried once
    // 3. Not an auth endpoint itself (login, register, or refresh route)
    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/verify-email");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      // If another request is currently refreshing the token, join the queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers && newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark request to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = getRefreshToken();
        // Request refreshed tokens via backend refresh endpoint
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          {
            withCredentials: true,
            headers: currentRefreshToken ? { "x-refresh-token": currentRefreshToken } : undefined,
          }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh endpoint");
        }

        // Store new access and refresh tokens in storage & cookies
        setAuthTokens(newAccessToken, newRefreshToken);

        // Resume all queued concurrent requests with the new access token
        processQueue(null, newAccessToken);

        // Retry original failed request with the new access token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr: any) {
        // Refresh token failed, expired, or invalid
        processQueue(refreshErr, null);
        clearAuthTokens();

        // Prevent repeated redirects and logout loops
        if (!isLoggingOut) {
          isLoggingOut = true;
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/auth/login") &&
            !window.location.pathname.startsWith("/auth/signup")
          ) {
            window.location.href = "/auth/login";
          }
          setTimeout(() => {
            isLoggingOut = false;
          }, 3000);
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Do NOT refresh on 403 (Forbidden), network errors, or 5xx server errors
    return Promise.reject(error);
  }
);

export default api;
