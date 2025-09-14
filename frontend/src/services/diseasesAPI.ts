import api from "./api"
import type { DiseaseRecord, PaginatedResponse } from "../types"

export interface CreateDiseaseRequest {
  animal_id: number
  disease_name: string
  symptoms: string
  diagnosis_date: string
  treatment?: string
  severity: "low" | "medium" | "high"
}

export interface GetDiseasesParams {
  page?: number
  size?: number
  animal_id?: number
  severity?: "low" | "medium" | "high"
}

export const diseasesAPI = {
  getDiseases: async (params: GetDiseasesParams): Promise<PaginatedResponse<DiseaseRecord>> => {
    const response = await api.get("/diseases", { params })
    return response.data
  },

  getDiseaseById: async (id: number): Promise<DiseaseRecord> => {
    const response = await api.get(`/diseases/${id}`)
    return response.data
  },

  createDisease: async (data: CreateDiseaseRequest): Promise<DiseaseRecord> => {
    const response = await api.post("/diseases", data)
    return response.data
  },

  updateDisease: async (id: number, data: Partial<DiseaseRecord>): Promise<DiseaseRecord> => {
    const response = await api.put(`/diseases/${id}`, data)
    return response.data
  },

  deleteDisease: async (id: number): Promise<void> => {
    await api.delete(`/diseases/${id}`)
  },
}
