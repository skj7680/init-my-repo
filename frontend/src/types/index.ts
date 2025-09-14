export interface User {
  id: number
  username: string
  email: string
  role: "farmer" | "vet" | "admin"
  is_active: boolean
  created_at: string
}

export interface Farm {
  id: number
  name: string
  location?: string
  timezone: string
  owner_id: number
  created_at: string
}

export interface Animal {
  id: number
  tag_number: string
  breed?: string
  dob?: string
  sex?: string
  parity: number
  current_weight?: number
  lactation_start_date?: string
  farm_id: number
  is_active: boolean
  created_at: string
}

export interface MilkRecord {
  id: number
  animal_id: number
  date: string
  morning_l: number
  evening_l: number
  total_l?: number
  fat_percentage?: number
  protein_percentage?: number
  somatic_cell_count?: number
  created_at: string
}

export interface DiseaseRecord {
  id: number
  animal_id: number
  disease_name: string
  diagnosis_date: string
  severity?: string
  treatment?: string
  recovery_date?: string
  vet_notes?: string
  is_resolved: boolean
  created_at: string
}

export interface MilkPrediction {
  animal_id: string
  predicted_milk_yield: number
  confidence_score: number
  factors: Record<string, any>
}

export interface DiseasePrediction {
  animal_id: string
  disease_risk: number
  risk_level: string
  recommended_actions: string[]
  confidence_score: number
}

export interface Alert {
  id: number
  animal_id?: number
  farm_id?: number
  alert_type: string
  severity: string
  message: string
  is_resolved: boolean
  created_at: string
  resolved_at?: string
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

// Form interfaces
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role: "farmer" | "vet" | "admin"
}

export interface AnimalCreateRequest {
  tag_number: string
  breed?: string
  dob?: string
  sex?: string
  parity: number
  current_weight?: number
  lactation_start_date?: string
  farm_id: number
}

export interface FarmCreateRequest {
  name: string
  location?: string
  timezone: string
}

export interface MilkRecordCreateRequest {
  animal_id: number
  date: string
  morning_l: number
  evening_l: number
  fat_percentage?: number
  protein_percentage?: number
  somatic_cell_count?: number
}

export interface DiseaseRecordCreateRequest {
  animal_id: number
  disease_name: string
  diagnosis_date: string
  severity?: string
  treatment?: string
  vet_notes?: string
}

export interface MilkPredictionRequest {
  animal_id: string
  breed: string
  age_months: number
  parity: number
  weight_kg: number
  feed_quantity_kg: number
  protein_content_percent: number
  temperature_c: number
  humidity_percent: number
  activity_hours: number
  rumination_hours: number
  health_score: number
}

export interface DiseasePredictionRequest {
  animal_id: string
  breed: string
  age_months: number
  parity: number
  health_score: number
  activity_hours: number
  rumination_hours: number
  milk_yield_trend: number
  temperature_c: number
  humidity_percent: number
}
