import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5555/api";
console.log("[EMPMS API Client] Active Base URL:", API_BASE_URL);

// Token storage (in-memory + localStorage backup across browser reloads)
let memoryAccessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("empms_access_token") : null;
let memoryRefreshToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("empms_refresh_token") : null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("empms_access_token", token);
    } else {
      localStorage.removeItem("empms_access_token");
    }
  }
};

export const setRefreshToken = (token: string | null) => {
  memoryRefreshToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("empms_refresh_token", token);
    } else {
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

export const getAccessToken = () => memoryAccessToken;
export const getRefreshToken = () => memoryRefreshToken;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enables cookie passing for refresh tokens
});

// Request interceptor: attach memory access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (memoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${memoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency handling for refresh token rotation
let isRefreshing = false;
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

// Response interceptor: handle automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried and not the login/refresh endpoint
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = getRefreshToken();
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          {
            withCredentials: true,
            headers: currentRefreshToken
              ? { "x-refresh-token": currentRefreshToken }
              : undefined,
          }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken;
        setAuthTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuthTokens();
        // Clear tokens and redirect on session death
        if (window.location.pathname !== "/auth/login" && window.location.pathname !== "/auth/signup") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
