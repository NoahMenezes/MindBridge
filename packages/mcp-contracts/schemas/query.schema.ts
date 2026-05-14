/**
 * @file schemas/query.schema.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Search query input schema with all optional parameters.
 */

import { z } from "zod"
import { LIMITS } from "../constants/limits"
import { WorkspaceIdSchema } from "./workspace.schema"

export const SearchQuerySchema = z.object({
  /** Natural-language search query. Max 500 chars (enforced here, not by callers). */
  query: z
    .string()
    .min(LIMITS.QUERY_MIN)
    .max(LIMITS.QUERY_MAX),

  /**
   * Workspace to search within.
   * Use "*" to search all workspaces globally.
   */
  workspace: WorkspaceIdSchema,

  /**
   * Maximum number of results to return.
   * @default LIMITS.SEARCH_LIMIT_DEFAULT
   */
  limit: z
    .number()
    .int()
    .min(LIMITS.SEARCH_LIMIT_MIN)
    .max(LIMITS.SEARCH_LIMIT_MAX)
    .default(LIMITS.SEARCH_LIMIT_DEFAULT),

  /**
   * Minimum relevance score for results to be included.
   * Results below this threshold are discarded.
   * @default LIMITS.SCORE_MIN_DEFAULT
   */
  min_score: z
    .number()
    .min(LIMITS.SCORE_MIN)
    .max(LIMITS.SCORE_MAX)
    .default(LIMITS.SCORE_MIN_DEFAULT),
})

export type SearchQuery = z.infer<typeof SearchQuerySchema>
