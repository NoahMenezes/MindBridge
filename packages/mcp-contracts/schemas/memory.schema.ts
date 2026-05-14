

import { z } from "zod"
import { LIMITS } from "../constants/limits"





export const MemoryTypeSchema = z.enum([
  "project",
  "preference",
  "goal",
  "collaborator",
  "note",
  "context",
])

export type MemoryType = z.infer<typeof MemoryTypeSchema>





export const MemorySchema = z.object({
  
  id: z.string().min(1),

  
  workspace: z.string().min(LIMITS.WORKSPACE_MIN).max(LIMITS.WORKSPACE_MAX),

  
  type: MemoryTypeSchema,

  
  summary: z
    .string()
    .min(LIMITS.MEMORY_SUMMARY_MIN)
    .max(LIMITS.MEMORY_SUMMARY_MAX),

  
  content: z
    .string()
    .min(LIMITS.MEMORY_CONTENT_MIN)
    .max(LIMITS.MEMORY_CONTENT_MAX),

  
  score: z.number().min(LIMITS.SCORE_MIN).max(LIMITS.SCORE_MAX).optional(),

  
  tags: z
    .array(z.string().min(LIMITS.TAG_MIN_LENGTH).max(LIMITS.TAG_MAX_LENGTH))
    .max(LIMITS.TAGS_MAX_COUNT)
    .default([]),

  
  timestamp: z.string().datetime({ offset: true }),
})

export type Memory = z.infer<typeof MemorySchema>





export const MemoryResultSchema = MemorySchema.extend({
  score: z.number().min(LIMITS.SCORE_MIN).max(LIMITS.SCORE_MAX),
})

export type MemoryResult = z.infer<typeof MemoryResultSchema>
