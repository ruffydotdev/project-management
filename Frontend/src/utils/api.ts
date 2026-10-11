import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5555/api";
console.log("[EMPMS API Client] Active Base URL:", API_BASE_URL);

// In-memory access token storage (populated on login/refresh from response for Authorization header)
let memoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const setRefreshToken = (_token: string | null) => {
  // Refresh token is managed securely and exclusively via HttpOnly cookie set/cleared by backend
};

export const setAuthTokens = (accessToken: string | null, _refreshToken?: string | null) => {
  setAccessToken(accessToken);
};

export const clearAuthTokens = () => {
  setAccessToken(null);
  // Clear any residual legacy localStorage tokens if present
  if (typeof window !== "undefined") {
    localStorage.removeItem("empms_access_token");
    localStorage.removeItem("empms_refresh_token");
  }
};

export const getAccessToken = (): string | null => {
  return memoryAccessToken;
};

export const getRefreshToken = (): string | null => {
  // Handled automatically by browser via withCredentials cookies
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
        // Request refreshed tokens via backend refresh endpoint using withCredentials (HttpOnly cookie)
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
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
