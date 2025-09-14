import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Animal } from "../../types"
import { animalsAPI } from "../../services/animalsAPI"

interface AnimalsState {
  animals: Animal[]
  currentAnimal: Animal | null
  total: number
  page: number
  size: number
  isLoading: boolean
  error: string | null
}

const initialState: AnimalsState = {
  animals: [],
  currentAnimal: null,
  total: 0,
  page: 1,
  size: 10,
  isLoading: false,
  error: null,
}

export const fetchAnimals = createAsyncThunk(
  "animals/fetchAnimals",
  async ({
    page = 1,
    size = 10,
    farm_id,
    breed,
    is_active,
  }: {
    page?: number
    size?: number
    farm_id?: number
    breed?: string
    is_active?: boolean
  }) => {
    const response = await animalsAPI.getAnimals({ page, size, farm_id, breed, is_active })
    return response
  },
)

export const fetchAnimalById = createAsyncThunk("animals/fetchAnimalById", async (id: number) => {
  const response = await animalsAPI.getAnimalById(id)
  return response
})

export const createAnimal = createAsyncThunk(
  "animals/createAnimal",
  async (animalData: {
    tag_number: string
    name?: string
    breed: string
    birth_date: string
    gender: "male" | "female"
    farm_id: number
  }) => {
    const response = await animalsAPI.createAnimal(animalData)
    return response
  },
)

export const updateAnimal = createAsyncThunk(
  "animals/updateAnimal",
  async ({ id, data }: { id: number; data: Partial<Animal> }) => {
    const response = await animalsAPI.updateAnimal(id, data)
    return response
  },
)

export const deleteAnimal = createAsyncThunk("animals/deleteAnimal", async (id: number) => {
  await animalsAPI.deleteAnimal(id)
  return id
})

const animalsSlice = createSlice({
  name: "animals",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentAnimal: (state) => {
      state.currentAnimal = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Animals
      .addCase(fetchAnimals.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAnimals.fulfilled, (state, action) => {
        state.isLoading = false
        state.animals = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.size = action.payload.size
      })
      .addCase(fetchAnimals.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to fetch animals"
      })
      // Fetch Animal by ID
      .addCase(fetchAnimalById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAnimalById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentAnimal = action.payload
      })
      .addCase(fetchAnimalById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to fetch animal"
      })
      // Create Animal
      .addCase(createAnimal.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createAnimal.fulfilled, (state, action) => {
        state.isLoading = false
        state.animals.unshift(action.payload)
        state.total += 1
      })
      .addCase(createAnimal.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to create animal"
      })
      // Update Animal
      .addCase(updateAnimal.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateAnimal.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.animals.findIndex((animal) => animal.id === action.payload.id)
        if (index !== -1) {
          state.animals[index] = action.payload
        }
        if (state.currentAnimal?.id === action.payload.id) {
          state.currentAnimal = action.payload
        }
      })
      .addCase(updateAnimal.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to update animal"
      })
      // Delete Animal
      .addCase(deleteAnimal.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteAnimal.fulfilled, (state, action) => {
        state.isLoading = false
        state.animals = state.animals.filter((animal) => animal.id !== action.payload)
        state.total -= 1
      })
      .addCase(deleteAnimal.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to delete animal"
      })
  },
})

export const { clearError, clearCurrentAnimal } = animalsSlice.actions
export default animalsSlice.reducer
