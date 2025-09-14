import api from "./api"

export interface ReportParams {
  start_date?: string
  end_date?: string
  farm_id?: number
  animal_id?: number
  format?: "json" | "csv"
}

export interface SummaryReport {
  total_animals: number
  total_farms: number
  total_milk_records: number
  total_diseases: number
  avg_daily_yield: number
  active_alerts: number
}

export interface MilkProductionReport {
  period: string
  total_yield: number
  average_yield: number
  records_count: number
  top_performers: Array<{
    animal_id: number
    tag_number: string
    total_yield: number
  }>
}

export interface HealthReport {
  total_cases: number
  active_cases: number
  recovered_cases: number
  severity_breakdown: {
    low: number
    medium: number
    high: number
  }
  common_diseases: Array<{
    disease_name: string
    count: number
  }>
}

export const reportsAPI = {
  getSummaryReport: async (params: ReportParams): Promise<SummaryReport> => {
    const response = await api.get("/reports/summary", { params })
    return response.data
  },

  getMilkProductionReport: async (params: ReportParams): Promise<MilkProductionReport> => {
    const response = await api.get("/reports/milk-production", { params })
    return response.data
  },

  getHealthReport: async (params: ReportParams): Promise<HealthReport> => {
    const response = await api.get("/reports/health", { params })
    return response.data
  },

  getAlertsReport: async (params: ReportParams) => {
    const response = await api.get("/reports/alerts", { params })
    return response.data
  },

  exportReport: async (reportType: string, params: ReportParams & { format: "csv" }): Promise<Blob> => {
    const response = await api.get(`/reports/${reportType}`, {
      params,
      responseType: "blob",
    })
    return response.data
  },
}
