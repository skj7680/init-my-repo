import { z } from "zod"

export const AnimalSchema = z.object({
  tag_number: z.string().min(1).max(50),
  breed: z.enum(["Holstein", "Jersey", "Guernsey", "Brown Swiss"]),
  birth_date: z.string().refine((date) => {
    const birthDate = new Date(date)
    const now = new Date()
    const maxAge = new Date()
    maxAge.setFullYear(maxAge.getFullYear() - 20) // Max 20 years old
    return birthDate <= now && birthDate >= maxAge
  }),
  weight: z.number().min(200).max(1000).optional(),
  health_status: z.enum(["healthy", "sick", "recovering"]).default("healthy"),
})

export const MilkRecordSchema = z.object({
  animal_id: z.string().uuid(),
  date: z.string().refine((date) => {
    const recordDate = new Date(date)
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return recordDate <= now && recordDate >= oneYearAgo
  }),
  morning_yield: z.number().min(0).max(50),
  evening_yield: z.number().min(0).max(50),
  fat_content: z.number().min(0).max(10).optional(),
  protein_content: z.number().min(0).max(10).optional(),
})

export const PredictionRequestSchema = z.object({
  animal_ids: z.array(z.string().uuid()).min(1).max(100),
  prediction_type: z.enum(["milk_yield", "health_risk"]),
  days_ahead: z.number().min(1).max(30).default(7),
})

export type AnimalInput = z.infer<typeof AnimalSchema>
export type MilkRecordInput = z.infer<typeof MilkRecordSchema>
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>
