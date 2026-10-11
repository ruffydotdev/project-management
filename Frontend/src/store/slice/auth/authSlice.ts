import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api, { setAuthTokens, clearAuthTokens } from "../../../utils/api";
import type { UserRole } from "../../../lib/data/enums";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber: string;
  designation: string;
  department: string;
  joiningDate: string;
  status: "Active" | "Inactive";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
  verificationEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialLoading: true,
  error: null,
  verificationEmail: null,
};

// Check current session on app mount via authenticated /auth/me endpoint.
// If accessToken is expired or missing, Axios interceptor will automatically trigger /auth/refresh and retry!
export const checkAuth = createAsyncThunk("auth/checkAuth", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/auth/me");
    return response.data.data.user;
  } catch (err: any) {
    clearAuthTokens();
    return rejectWithValue(err.response?.data?.message || "Session not found");
  }
});

// Login action
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { accessToken, refreshToken, user } = response.data.data;
      setAuthTokens(accessToken, refreshToken);
      return user;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Login failed",
        requiresVerification: err.response?.data?.requiresVerification || false,
        email: err.response?.data?.email || credentials.email,
      });
    }
  }
);

// Logout action
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAuthTokens();
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setVerificationEmail: (state, action: PayloadAction<string | null>) => {
      state.verificationEmail = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // checkAuth
    builder.addCase(checkAuth.pending, (state) => {
      state.isInitialLoading = true;
    });
    builder.addCase(checkAuth.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialLoading = false;
      state.error = null;
    });
    builder.addCase(checkAuth.rejected, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialLoading = false;
    });

    // login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action: any) => {
      state.isLoading = false;
      state.error = action.payload?.message || "Login failed";
      if (action.payload?.requiresVerification) {
        state.verificationEmail = action.payload.email;
      }
    });

    // logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { setVerificationEmail, clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
