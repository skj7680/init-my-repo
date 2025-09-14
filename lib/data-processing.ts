import { createClient } from "@/lib/supabase/server"
import type { Animal, MilkRecord } from "@/types/database"

export interface ProcessedFeatures {
  animal_id: string
  age_days: number
  breed_encoded: number
  weight: number
  avg_daily_yield_7d: number
  avg_daily_yield_30d: number
  yield_trend_7d: number
  fat_content_avg: number
  protein_content_avg: number
  days_since_last_record: number
  seasonal_factor: number
  health_status_encoded: number
}

export class DataProcessor {
  private supabase = createClient()

  async getAnimalFeatures(animalId: string): Promise<ProcessedFeatures | null> {
    try {
      // Get animal data
      const { data: animal, error: animalError } = await (await this.supabase)
        .from("animals")
        .select("*")
        .eq("id", animalId)
        .single()

      if (animalError || !animal) {
        console.error("Error fetching animal:", animalError)
        return null
      }

      // Get recent milk records (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: milkRecords, error: recordsError } = await (await this.supabase)
        .from("milk_records")
        .select("*")
        .eq("animal_id", animalId)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false })

      if (recordsError) {
        console.error("Error fetching milk records:", recordsError)
        return null
      }

      return this.processFeatures(animal, milkRecords || [])
    } catch (error) {
      console.error("Error in getAnimalFeatures:", error)
      return null
    }
  }

  private processFeatures(animal: Animal, milkRecords: MilkRecord[]): ProcessedFeatures {
    // Calculate age in days
    const birthDate = new Date(animal.birth_date)
    const ageDays = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24))

    // Encode breed (simple ordinal encoding)
    const breedEncoding: Record<string, number> = {
      Holstein: 1,
      Jersey: 2,
      Guernsey: 3,
      "Brown Swiss": 4,
    }
    const breedEncoded = breedEncoding[animal.breed] || 0

    // Encode health status
    const healthEncoding: Record<string, number> = {
      healthy: 1,
      recovering: 0.5,
      sick: 0,
    }
    const healthStatusEncoded = healthEncoding[animal.health_status] || 0.5

    // Calculate milk yield statistics
    const yields = milkRecords.map((r) => r.total_yield)
    const last7Days = yields.slice(0, 7)
    const last30Days = yields

    const avgDailyYield7d = last7Days.length > 0 ? last7Days.reduce((a, b) => a + b, 0) / last7Days.length : 0
    const avgDailyYield30d = last30Days.length > 0 ? last30Days.reduce((a, b) => a + b, 0) / last30Days.length : 0

    // Calculate yield trend (slope of last 7 days)
    let yieldTrend7d = 0
    if (last7Days.length >= 2) {
      const x = Array.from({ length: last7Days.length }, (_, i) => i)
      const y = last7Days
      const n = x.length
      const sumX = x.reduce((a, b) => a + b, 0)
      const sumY = y.reduce((a, b) => a + b, 0)
      const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
      const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0)

      yieldTrend7d = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    }

    // Calculate average fat and protein content
    const fatContents = milkRecords.filter((r) => r.fat_content).map((r) => r.fat_content!)
    const proteinContents = milkRecords.filter((r) => r.protein_content).map((r) => r.protein_content!)

    const fatContentAvg = fatContents.length > 0 ? fatContents.reduce((a, b) => a + b, 0) / fatContents.length : 3.5
    const proteinContentAvg =
      proteinContents.length > 0 ? proteinContents.reduce((a, b) => a + b, 0) / proteinContents.length : 3.2

    // Days since last record
    const daysSinceLastRecord =
      milkRecords.length > 0
        ? Math.floor((Date.now() - new Date(milkRecords[0].date).getTime()) / (1000 * 60 * 60 * 24))
        : 999

    // Seasonal factor (based on day of year)
    const dayOfYear = new Date().getDayOfYear()
    const seasonalFactor = 1 + 0.2 * Math.sin((2 * Math.PI * dayOfYear) / 365)

    return {
      animal_id: animal.id,
      age_days: ageDays,
      breed_encoded: breedEncoded,
      weight: animal.weight || 600,
      avg_daily_yield_7d: avgDailyYield7d,
      avg_daily_yield_30d: avgDailyYield30d,
      yield_trend_7d: yieldTrend7d,
      fat_content_avg: fatContentAvg,
      protein_content_avg: proteinContentAvg,
      days_since_last_record: daysSinceLastRecord,
      seasonal_factor: seasonalFactor,
      health_status_encoded: healthStatusEncoded,
    }
  }

  async getBatchFeatures(animalIds: string[]): Promise<ProcessedFeatures[]> {
    const features: ProcessedFeatures[] = []

    for (const animalId of animalIds) {
      const animalFeatures = await this.getAnimalFeatures(animalId)
      if (animalFeatures) {
        features.push(animalFeatures)
      }
    }

    return features
  }

  validateFeatures(features: ProcessedFeatures): boolean {
    // Basic validation rules
    return (
      features.age_days > 0 &&
      features.age_days < 10000 && // Max 27 years
      features.weight > 200 &&
      features.weight < 1000 &&
      features.avg_daily_yield_7d >= 0 &&
      features.avg_daily_yield_30d >= 0 &&
      features.fat_content_avg > 0 &&
      features.fat_content_avg < 10 &&
      features.protein_content_avg > 0 &&
      features.protein_content_avg < 10
    )
  }
}

// Extend Date prototype for day of year calculation
declare global {
  interface Date {
    getDayOfYear(): number
  }
}

Date.prototype.getDayOfYear = function () {
  const start = new Date(this.getFullYear(), 0, 0)
  const diff = this.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}
