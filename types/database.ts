export interface Farm {
  id: string
  name: string
  location: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Animal {
  id: string
  farm_id: string
  tag_number: string
  breed: string
  birth_date: string
  weight?: number
  health_status: string
  created_at: string
  updated_at: string
}

export interface MilkRecord {
  id: string
  animal_id: string
  date: string
  morning_yield: number
  evening_yield: number
  total_yield: number
  fat_content?: number
  protein_content?: number
  created_at: string
}

export interface Prediction {
  id: string
  animal_id: string
  prediction_type: "milk_yield" | "health_risk"
  predicted_value: number
  confidence_score: number
  model_version: string
  features: Record<string, any>
  created_at: string
}

export interface ModelMetric {
  id: string
  model_name: string
  model_version: string
  metric_name: string
  metric_value: number
  created_at: string
}
