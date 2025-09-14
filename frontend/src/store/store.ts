import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import animalsReducer from "./slices/animalsSlice"
import farmsReducer from "./slices/farmsSlice"
import milkRecordsReducer from "./slices/milkRecordsSlice"
import diseasesReducer from "./slices/diseasesSlice"
import predictionsReducer from "./slices/predictionsSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    animals: animalsReducer,
    farms: farmsReducer,
    milkRecords: milkRecordsReducer,
    diseases: diseasesReducer,
    predictions: predictionsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch