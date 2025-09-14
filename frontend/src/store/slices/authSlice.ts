import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { AuthState } from "../../types"
import { authAPI } from "../../services/authAPI"

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,
  error: null,
}

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const response = await authAPI.login(email, password)
    localStorage.setItem("token", response.access_token)
    return response
  },
)

export const register = createAsyncThunk(
  "auth/register",
  async ({
    email,
    password,
    full_name,
    role,
    farm_id,
  }: {
    email: string
    password: string
    full_name: string
    role: "farmer" | "vet" | "admin"
    farm_id?: number
  }) => {
    const response = await authAPI.register(email, password, full_name, role, farm_id)
    return response
  },
)

export const checkAuth = createAsyncThunk("auth/checkAuth", async () => {
  const response = await authAPI.getCurrentUser()
  return response
})

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token")
  return null
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.token = action.payload.access_token
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Login failed"
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Registration failed"
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false
        state.token = null
        state.user = null
        localStorage.removeItem("token")
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
