import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5555/api";
console.log("[EMPMS API Client] Active Base URL:", API_BASE_URL);


let memoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const setRefreshToken = (_token: string | null) => {
  
};

export const setAuthTokens = (accessToken: string | null, _refreshToken?: string | null) => {
  setAccessToken(accessToken);
};

export const clearAuthTokens = () => {
  setAccessToken(null);
  
  if (typeof window !== "undefined") {
    localStorage.removeItem("empms_access_token");
    localStorage.removeItem("empms_refresh_token");
  }
};

export const getAccessToken = (): string | null => {
  return memoryAccessToken;
};

export const getRefreshToken = (): string | null => {
  
  return null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});


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


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    
    
    
    
    
    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/verify-email");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      
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

      
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh endpoint");
        }

        
        setAccessToken(newAccessToken);

        
        processQueue(null, newAccessToken);

        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr: any) {
        
        processQueue(refreshErr, null);
        clearAuthTokens();

        
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

    
    return Promise.reject(error);
  }
);

export default api;
