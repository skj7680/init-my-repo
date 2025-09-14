import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Farm } from "../../types"
import { farmsAPI } from "../../services/farmsAPI"

interface FarmsState {
  farms: Farm[]
  currentFarm: Farm | null
  total: number
  page: number
  size: number
  isLoading: boolean
  error: string | null
}

const initialState: FarmsState = {
  farms: [],
  currentFarm: null,
  total: 0,
  page: 1,
  size: 10,
  isLoading: false,
  error: null,
}

export const fetchFarms = createAsyncThunk(
  "farms/fetchFarms",
  async ({ page = 1, size = 10 }: { page?: number; size?: number }) => {
    const response = await farmsAPI.getFarms({ page, size })
    return response
  },
)

export const fetchFarmById = createAsyncThunk("farms/fetchFarmById", async (id: number) => {
  const response = await farmsAPI.getFarmById(id)
  return response
})

export const createFarm = createAsyncThunk(
  "farms/createFarm",
  async (farmData: { name: string; location: string; size_hectares: number }) => {
    const response = await farmsAPI.createFarm(farmData)
    return response
  },
)

export const updateFarm = createAsyncThunk(
  "farms/updateFarm",
  async ({ id, data }: { id: number; data: Partial<Farm> }) => {
    const response = await farmsAPI.updateFarm(id, data)
    return response
  },
)

export const deleteFarm = createAsyncThunk("farms/deleteFarm", async (id: number) => {
  await farmsAPI.deleteFarm(id)
  return id
})

const farmsSlice = createSlice({
  name: "farms",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentFarm: (state) => {
      state.currentFarm = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Farms
      .addCase(fetchFarms.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchFarms.fulfilled, (state, action) => {
        state.isLoading = false
        state.farms = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.size = action.payload.size
      })
      .addCase(fetchFarms.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to fetch farms"
      })
      // Create Farm
      .addCase(createFarm.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createFarm.fulfilled, (state, action) => {
        state.isLoading = false
        state.farms.unshift(action.payload)
        state.total += 1
      })
      .addCase(createFarm.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to create farm"
      })
      // Update Farm
      .addCase(updateFarm.fulfilled, (state, action) => {
        const index = state.farms.findIndex((farm) => farm.id === action.payload.id)
        if (index !== -1) {
          state.farms[index] = action.payload
        }
      })
      // Delete Farm
      .addCase(deleteFarm.fulfilled, (state, action) => {
        state.farms = state.farms.filter((farm) => farm.id !== action.payload)
        state.total -= 1
      })
  },
})

export const { clearError, clearCurrentFarm } = farmsSlice.actions
export default farmsSlice.reducer
