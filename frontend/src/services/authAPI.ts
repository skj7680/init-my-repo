import api from "./api"
import type { User } from "../types"

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)

    const response = await api.post("/api/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    
    // Get user info after login
    const userResponse = await api.get("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${response.data.access_token}`
      }
    })
    
    return {
      ...response.data,
      user: userResponse.data
    }
  },

  register: async (
    username: string,
    password: string,
    email: string,
    role: "farmer" | "vet" | "admin",
  ): Promise<User> => {
    const response = await api.post("/api/auth/register", {
      username,
      password,
      email,
      role,
    })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/api/auth/me")
    return response.data
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await api.post("/api/auth/refresh")
    return response.data
  },
}
