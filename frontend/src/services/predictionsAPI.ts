import api from "./api"
import type { Prediction } from "../types"

export const predictionsAPI = {
  predictMilkYield: async (animalId: number): Promise<Prediction> => {
    const response = await api.post(`/predictions/milk-yield/${animalId}`)
    return response.data
  },

  predictDiseaseRisk: async (animalId: number): Promise<Prediction> => {
    const response = await api.post(`/predictions/disease-risk/${animalId}`)
    return response.data
  },

  batchPredict: async (animalIds: number[], predictionType: "milk_yield" | "disease_risk"): Promise<Prediction[]> => {
    const response = await api.post("/predictions/batch", {
      animal_ids: animalIds,
      prediction_type: predictionType,
    })
    return response.data
  },
}
