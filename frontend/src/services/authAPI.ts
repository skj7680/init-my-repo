import api from "./api"
import type { User } from "../types"

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role: "farmer" | "vet" | "admin"
  farm_id?: number
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData()
    formData.append("username", email)
    formData.append("password", password)

    const response = await api.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    return response.data
  },

  register: async (
    email: string,
    password: string,
    full_name: string,
    role: "farmer" | "vet" | "admin",
    farm_id?: number,
  ): Promise<User> => {
    const response = await api.post("/auth/register", {
      email,
      password,
      full_name,
      role,
      farm_id,
    })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/auth/me")
    return response.data
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await api.post("/auth/refresh")
    return response.data
  },
}
