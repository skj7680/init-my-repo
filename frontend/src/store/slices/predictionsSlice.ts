import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Prediction } from "../../types"
import { predictionsAPI } from "../../services/predictionsAPI"

interface PredictionsState {
  predictions: Prediction[]
  currentPrediction: Prediction | null
  isLoading: boolean
  error: string | null
}

const initialState: PredictionsState = {
  predictions: [],
  currentPrediction: null,
  isLoading: false,
  error: null,
}

export const predictMilkYield = createAsyncThunk("predictions/predictMilkYield", async (animalId: number) => {
  const response = await predictionsAPI.predictMilkYield(animalId)
  return response
})

export const predictDiseaseRisk = createAsyncThunk("predictions/predictDiseaseRisk", async (animalId: number) => {
  const response = await predictionsAPI.predictDiseaseRisk(animalId)
  return response
})

export const batchPredict = createAsyncThunk(
  "predictions/batchPredict",
  async ({ animal_ids, prediction_type }: { animal_ids: number[]; prediction_type: "milk_yield" | "disease_risk" }) => {
    const response = await predictionsAPI.batchPredict(animal_ids, prediction_type)
    return response
  },
)

const predictionsSlice = createSlice({
  name: "predictions",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentPrediction: (state) => {
      state.currentPrediction = null
    },
    clearPredictions: (state) => {
      state.predictions = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Predict Milk Yield
      .addCase(predictMilkYield.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(predictMilkYield.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPrediction = action.payload
        state.predictions.unshift(action.payload)
      })
      .addCase(predictMilkYield.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to predict milk yield"
      })
      // Predict Disease Risk
      .addCase(predictDiseaseRisk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(predictDiseaseRisk.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPrediction = action.payload
        state.predictions.unshift(action.payload)
      })
      .addCase(predictDiseaseRisk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to predict disease risk"
      })
      // Batch Predict
      .addCase(batchPredict.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(batchPredict.fulfilled, (state, action) => {
        state.isLoading = false
        state.predictions = [...action.payload, ...state.predictions]
      })
      .addCase(batchPredict.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to perform batch prediction"
      })
  },
})

export const { clearError, clearCurrentPrediction, clearPredictions } = predictionsSlice.actions
export default predictionsSlice.reducer
