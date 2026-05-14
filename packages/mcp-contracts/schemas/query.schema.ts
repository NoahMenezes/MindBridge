

import { z } from "zod"
import { LIMITS } from "../constants/limits"
import { WorkspaceIdSchema } from "./workspace.schema"

export const SearchQuerySchema = z.object({
  
  query: z
    .string()
    .min(LIMITS.QUERY_MIN)
    .max(LIMITS.QUERY_MAX),

  
  workspace: WorkspaceIdSchema,

  
  limit: z
    .number()
    .int()
    .min(LIMITS.SEARCH_LIMIT_MIN)
    .max(LIMITS.SEARCH_LIMIT_MAX)
    .default(LIMITS.SEARCH_LIMIT_DEFAULT),

  
  min_score: z
    .number()
    .min(LIMITS.SCORE_MIN)
    .max(LIMITS.SCORE_MAX)
    .default(LIMITS.SCORE_MIN_DEFAULT),
})

export type SearchQuery = z.infer<typeof SearchQuerySchema>
