import api from "./api"
import type { MilkRecord, PaginatedResponse } from "../types"

export interface CreateMilkRecordRequest {
  animal_id: number
  date: string
  morning_yield: number
  evening_yield: number
  fat_content?: number
  protein_content?: number
}

export interface GetMilkRecordsParams {
  page?: number
  size?: number
  animal_id?: number
  start_date?: string
  end_date?: string
}

export const milkRecordsAPI = {
  getMilkRecords: async (params: GetMilkRecordsParams): Promise<PaginatedResponse<MilkRecord>> => {
    const response = await api.get("/milk-records", { params })
    return response.data
  },

  getMilkRecordById: async (id: number): Promise<MilkRecord> => {
    const response = await api.get(`/milk-records/${id}`)
    return response.data
  },

  createMilkRecord: async (data: CreateMilkRecordRequest): Promise<MilkRecord> => {
    const response = await api.post("/milk-records", data)
    return response.data
  },

  updateMilkRecord: async (id: number, data: Partial<MilkRecord>): Promise<MilkRecord> => {
    const response = await api.put(`/milk-records/${id}`, data)
    return response.data
  },

  deleteMilkRecord: async (id: number): Promise<void> => {
    await api.delete(`/milk-records/${id}`)
  },

  getMilkSummary: async (animal_id?: number, start_date?: string, end_date?: string) => {
    const response = await api.get("/milk-records/summary", {
      params: { animal_id, start_date, end_date },
    })
    return response.data
  },
}
