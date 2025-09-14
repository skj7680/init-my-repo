import api from "./api"
import type { Animal, PaginatedResponse } from "../types"

export interface CreateAnimalRequest {
  tag_number: string
  name?: string
  breed: string
  birth_date: string
  gender: "male" | "female"
  farm_id: number
}

export interface GetAnimalsParams {
  page?: number
  size?: number
  farm_id?: number
  breed?: string
  is_active?: boolean
}

export const animalsAPI = {
  getAnimals: async (params: GetAnimalsParams): Promise<PaginatedResponse<Animal>> => {
    const response = await api.get("/animals", { params })
    return response.data
  },

  getAnimalById: async (id: number): Promise<Animal> => {
    const response = await api.get(`/animals/${id}`)
    return response.data
  },

  createAnimal: async (data: CreateAnimalRequest): Promise<Animal> => {
    const response = await api.post("/animals", data)
    return response.data
  },

  updateAnimal: async (id: number, data: Partial<Animal>): Promise<Animal> => {
    const response = await api.put(`/animals/${id}`, data)
    return response.data
  },

  deleteAnimal: async (id: number): Promise<void> => {
    await api.delete(`/animals/${id}`)
  },
}
