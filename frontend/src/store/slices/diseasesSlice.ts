import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { DiseaseRecord } from "../../types"
import { diseasesAPI } from "../../services/diseasesAPI"

interface DiseasesState {
  diseases: DiseaseRecord[]
  currentDisease: DiseaseRecord | null
  total: number
  page: number
  size: number
  isLoading: boolean
  error: string | null
}

const initialState: DiseasesState = {
  diseases: [],
  currentDisease: null,
  total: 0,
  page: 1,
  size: 10,
  isLoading: false,
  error: null,
}

export const fetchDiseases = createAsyncThunk(
  "diseases/fetchDiseases",
  async ({
    page = 1,
    size = 10,
    animal_id,
    severity,
  }: {
    page?: number
    size?: number
    animal_id?: number
    severity?: "low" | "medium" | "high"
  }) => {
    const response = await diseasesAPI.getDiseases({ page, size, animal_id, severity })
    return response
  },
)

export const createDisease = createAsyncThunk(
  "diseases/createDisease",
  async (diseaseData: {
    animal_id: number
    disease_name: string
    symptoms: string
    diagnosis_date: string
    treatment?: string
    severity: "low" | "medium" | "high"
  }) => {
    const response = await diseasesAPI.createDisease(diseaseData)
    return response
  },
)

export const updateDisease = createAsyncThunk(
  "diseases/updateDisease",
  async ({ id, data }: { id: number; data: Partial<DiseaseRecord> }) => {
    const response = await diseasesAPI.updateDisease(id, data)
    return response
  },
)

export const deleteDisease = createAsyncThunk("diseases/deleteDisease", async (id: number) => {
  await diseasesAPI.deleteDisease(id)
  return id
})

const diseasesSlice = createSlice({
  name: "diseases",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Diseases
      .addCase(fetchDiseases.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDiseases.fulfilled, (state, action) => {
        state.isLoading = false
        state.diseases = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.size = action.payload.size
      })
      .addCase(fetchDiseases.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to fetch diseases"
      })
      // Create Disease
      .addCase(createDisease.fulfilled, (state, action) => {
        state.diseases.unshift(action.payload)
        state.total += 1
      })
      // Update Disease
      .addCase(updateDisease.fulfilled, (state, action) => {
        const index = state.diseases.findIndex((disease) => disease.id === action.payload.id)
        if (index !== -1) {
          state.diseases[index] = action.payload
        }
      })
      // Delete Disease
      .addCase(deleteDisease.fulfilled, (state, action) => {
        state.diseases = state.diseases.filter((disease) => disease.id !== action.payload)
        state.total -= 1
      })
  },
})

export const { clearError } = diseasesSlice.actions
export default diseasesSlice.reducer
