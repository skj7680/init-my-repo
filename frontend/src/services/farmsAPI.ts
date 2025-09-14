import api from "./api"
import type { Farm, PaginatedResponse } from "../types"

export interface CreateFarmRequest {
  name: string
  location: string
  size_hectares: number
}

export interface GetFarmsParams {
  page?: number
  size?: number
}

export const farmsAPI = {
  getFarms: async (params: GetFarmsParams): Promise<PaginatedResponse<Farm>> => {
    const response = await api.get("/farms", { params })
    return response.data
  },

  getFarmById: async (id: number): Promise<Farm> => {
    const response = await api.get(`/farms/${id}`)
    return response.data
  },

  createFarm: async (data: CreateFarmRequest): Promise<Farm> => {
    const response = await api.post("/farms", data)
    return response.data
  },

  updateFarm: async (id: number, data: Partial<Farm>): Promise<Farm> => {
    const response = await api.put(`/farms/${id}`, data)
    return response.data
  },

  deleteFarm: async (id: number): Promise<void> => {
    await api.delete(`/farms/${id}`)
  },
}
