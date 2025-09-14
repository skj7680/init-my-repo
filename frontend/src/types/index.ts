export interface User {
  id: number
  email: string
  full_name: string
  role: "farmer" | "vet" | "admin"
  farm_id?: number
  is_active: boolean
  created_at: string
}

export interface Farm {
  id: number
  name: string
  location: string
  size_hectares: number
  owner_id: number
  created_at: string
}

export interface Animal {
  id: number
  tag_number: string
  name?: string
  breed: string
  birth_date: string
  gender: "male" | "female"
  farm_id: number
  is_active: boolean
  created_at: string
}

export interface MilkRecord {
  id: number
  animal_id: number
  date: string
  morning_yield: number
  evening_yield: number
  total_yield: number
  fat_content?: number
  protein_content?: number
  created_at: string
}

export interface DiseaseRecord {
  id: number
  animal_id: number
  disease_name: string
  symptoms: string
  diagnosis_date: string
  treatment?: string
  recovery_date?: string
  severity: "low" | "medium" | "high"
  created_at: string
}

export interface Prediction {
  animal_id: number
  prediction_type: "milk_yield" | "disease_risk"
  predicted_value: number
  confidence: number
  factors: Record<string, any>
  created_at: string
}

export interface Alert {
  id: number
  animal_id: number
  alert_type: string
  message: string
  severity: "low" | "medium" | "high"
  is_resolved: boolean
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}
