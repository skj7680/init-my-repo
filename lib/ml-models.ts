import { DataProcessor, type ProcessedFeatures } from "@/lib/data-processing"
import { createClient } from "@/lib/supabase/server"
import type { Prediction } from "@/types/database"

export interface PredictionResult {
  predicted_value: number
  confidence_score: number
  model_used: string
  model_version: string
  features_used: ProcessedFeatures
}

export class MLModelService {
  private dataProcessor: DataProcessor
  private supabase = createClient()

  constructor() {
    this.dataProcessor = new DataProcessor()
  }

  async predictMilkYield(animalId: string): Promise<PredictionResult | null> {
    try {
      // Get processed features for the animal
      const features = await this.dataProcessor.getAnimalFeatures(animalId)
      if (!features || !this.dataProcessor.validateFeatures(features)) {
        console.error("Invalid features for animal:", animalId)
        return null
      }

      // Call Python ML service (this would be implemented as a separate microservice)
      const prediction = await this.callMLService("milk_yield", features)
      if (!prediction) {
        return null
      }

      // Store prediction in database
      await this.storePrediction(animalId, "milk_yield", prediction, features)

      return {
        ...prediction,
        features_used: features,
      }
    } catch (error) {
      console.error("Error predicting milk yield:", error)
      return null
    }
  }

  async predictHealthRisk(animalId: string): Promise<PredictionResult | null> {
    try {
      // Get processed features for the animal
      const features = await this.dataProcessor.getAnimalFeatures(animalId)
      if (!features || !this.dataProcessor.validateFeatures(features)) {
        console.error("Invalid features for animal:", animalId)
        return null
      }

      // Call Python ML service
      const prediction = await this.callMLService("health_risk", features)
      if (!prediction) {
        return null
      }

      // Store prediction in database
      await this.storePrediction(animalId, "health_risk", prediction, features)

      return {
        ...prediction,
        features_used: features,
      }
    } catch (error) {
      console.error("Error predicting health risk:", error)
      return null
    }
  }

  async batchPredict(animalIds: string[], predictionType: "milk_yield" | "health_risk"): Promise<PredictionResult[]> {
    const results: PredictionResult[] = []

    for (const animalId of animalIds) {
      let result: PredictionResult | null = null

      if (predictionType === "milk_yield") {
        result = await this.predictMilkYield(animalId)
      } else {
        result = await this.predictHealthRisk(animalId)
      }

      if (result) {
        results.push(result)
      }
    }

    return results
  }

  private async callMLService(
    predictionType: "milk_yield" | "health_risk",
    features: ProcessedFeatures,
  ): Promise<Omit<PredictionResult, "features_used"> | null> {
    try {
      // In a real implementation, this would call a Python microservice
      // For now, we'll implement a simple heuristic-based prediction

      if (predictionType === "milk_yield") {
        return this.heuristicMilkYieldPrediction(features)
      } else {
        return this.heuristicHealthRiskPrediction(features)
      }
    } catch (error) {
      console.error("Error calling ML service:", error)
      return null
    }
  }

  private heuristicMilkYieldPrediction(features: ProcessedFeatures): PredictionResult | null {
    // Simple heuristic-based prediction (replace with actual ML model calls)
    const baseYield = features.avg_daily_yield_30d || 20

    // Adjust based on various factors
    let predictedYield = baseYield

    // Age factor (peak production around 3-6 years)
    const ageYears = features.age_days / 365
    if (ageYears < 2) {
      predictedYield *= 0.7 // Young cows produce less
    } else if (ageYears > 8) {
      predictedYield *= 0.8 // Older cows produce less
    }

    // Health factor
    predictedYield *= features.health_status_encoded

    // Seasonal factor
    predictedYield *= features.seasonal_factor

    // Trend factor
    if (features.yield_trend_7d > 0) {
      predictedYield *= 1.05 // Positive trend
    } else if (features.yield_trend_7d < -0.5) {
      predictedYield *= 0.95 // Negative trend
    }

    // Add some randomness to simulate model uncertainty
    const uncertainty = 0.1
    const randomFactor = 1 + (Math.random() - 0.5) * uncertainty
    predictedYield *= randomFactor

    return {
      predicted_value: Math.max(0, predictedYield),
      confidence_score: 0.75, // Moderate confidence for heuristic
      model_used: "heuristic_milk_yield",
      model_version: "v1.0_heuristic",
    }
  }

  private heuristicHealthRiskPrediction(features: ProcessedFeatures): PredictionResult | null {
    let riskScore = 0.2 // Base low risk

    // Health status factor
    if (features.health_status_encoded < 0.5) {
      riskScore = 0.8 // High risk if already sick
    } else if (features.health_status_encoded < 1) {
      riskScore = 0.5 // Medium risk if recovering
    }

    // Yield trend factor
    if (features.yield_trend_7d < -1) {
      riskScore = Math.max(riskScore, 0.6) // Declining yield indicates potential health issues
    }

    // Days since last record factor
    if (features.days_since_last_record > 3) {
      riskScore = Math.max(riskScore, 0.4) // Missing data could indicate problems
    }

    // Age factor
    const ageYears = features.age_days / 365
    if (ageYears > 10) {
      riskScore = Math.max(riskScore, 0.4) // Older animals have higher risk
    }

    return {
      predicted_value: Math.min(1, riskScore),
      confidence_score: 0.7,
      model_used: "heuristic_health_risk",
      model_version: "v1.0_heuristic",
    }
  }

  private async storePrediction(
    animalId: string,
    predictionType: "milk_yield" | "health_risk",
    prediction: Omit<PredictionResult, "features_used">,
    features: ProcessedFeatures,
  ): Promise<void> {
    try {
      const { error } = await (await this.supabase).from("predictions").insert({
        animal_id: animalId,
        prediction_type: predictionType,
        predicted_value: prediction.predicted_value,
        confidence_score: prediction.confidence_score,
        model_version: prediction.model_version,
        features: features as any, // Store features as JSONB
      })

      if (error) {
        console.error("Error storing prediction:", error)
      }
    } catch (error) {
      console.error("Error storing prediction:", error)
    }
  }

  async getModelMetrics(): Promise<any[]> {
    try {
      const { data, error } = await (await this.supabase)
        .from("model_metrics")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching model metrics:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching model metrics:", error)
      return []
    }
  }

  async getPredictionHistory(animalId: string, limit = 50): Promise<Prediction[]> {
    try {
      const { data, error } = await (await this.supabase)
        .from("predictions")
        .select("*")
        .eq("animal_id", animalId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching prediction history:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching prediction history:", error)
      return []
    }
  }
}
