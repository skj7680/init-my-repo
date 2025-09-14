import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { MilkRecord } from "../../types"
import { milkRecordsAPI } from "../../services/milkRecordsAPI"

interface MilkRecordsState {
  milkRecords: MilkRecord[]
  currentRecord: MilkRecord | null
  total: number
  page: number
  size: number
  isLoading: boolean
  error: string | null
}

const initialState: MilkRecordsState = {
  milkRecords: [],
  currentRecord: null,
  total: 0,
  page: 1,
  size: 10,
  isLoading: false,
  error: null,
}

export const fetchMilkRecords = createAsyncThunk(
  "milkRecords/fetchMilkRecords",
  async ({
    page = 1,
    size = 10,
    animal_id,
    start_date,
    end_date,
  }: {
    page?: number
    size?: number
    animal_id?: number
    start_date?: string
    end_date?: string
  }) => {
    const response = await milkRecordsAPI.getMilkRecords({ page, size, animal_id, start_date, end_date })
    return response
  },
)

export const createMilkRecord = createAsyncThunk(
  "milkRecords/createMilkRecord",
  async (recordData: {
    animal_id: number
    date: string
    morning_yield: number
    evening_yield: number
    fat_content?: number
    protein_content?: number
  }) => {
    const response = await milkRecordsAPI.createMilkRecord(recordData)
    return response
  },
)

export const updateMilkRecord = createAsyncThunk(
  "milkRecords/updateMilkRecord",
  async ({ id, data }: { id: number; data: Partial<MilkRecord> }) => {
    const response = await milkRecordsAPI.updateMilkRecord(id, data)
    return response
  },
)

export const deleteMilkRecord = createAsyncThunk("milkRecords/deleteMilkRecord", async (id: number) => {
  await milkRecordsAPI.deleteMilkRecord(id)
  return id
})

const milkRecordsSlice = createSlice({
  name: "milkRecords",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Milk Records
      .addCase(fetchMilkRecords.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMilkRecords.fulfilled, (state, action) => {
        state.isLoading = false
        state.milkRecords = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.size = action.payload.size
      })
      .addCase(fetchMilkRecords.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to fetch milk records"
      })
      // Create Milk Record
      .addCase(createMilkRecord.fulfilled, (state, action) => {
        state.milkRecords.unshift(action.payload)
        state.total += 1
      })
      // Update Milk Record
      .addCase(updateMilkRecord.fulfilled, (state, action) => {
        const index = state.milkRecords.findIndex((record) => record.id === action.payload.id)
        if (index !== -1) {
          state.milkRecords[index] = action.payload
        }
      })
      // Delete Milk Record
      .addCase(deleteMilkRecord.fulfilled, (state, action) => {
        state.milkRecords = state.milkRecords.filter((record) => record.id !== action.payload)
        state.total -= 1
      })
  },
})

export const { clearError } = milkRecordsSlice.actions
export default milkRecordsSlice.reducer
