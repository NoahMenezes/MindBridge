/**
 * @file constants/limits.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * All numeric and string-length constraints enforced across the MCP layer.
 * Change a value here and every schema/validation picks it up automatically.
 */

export const LIMITS = {
  // Memory content
  MEMORY_CONTENT_MIN:   1,
  MEMORY_CONTENT_MAX:   10_000,
  MEMORY_SUMMARY_MIN:   1,
  MEMORY_SUMMARY_MAX:   500,

  // Tags
  TAG_MIN_LENGTH:       1,
  TAG_MAX_LENGTH:       64,
  TAGS_MAX_COUNT:       20,

  // Workspace identifier
  WORKSPACE_MIN:        1,
  WORKSPACE_MAX:        256,

  // Search query
  QUERY_MIN:            1,
  QUERY_MAX:            500,

  // Pagination
  SEARCH_LIMIT_MIN:     1,
  SEARCH_LIMIT_MAX:     50,
  SEARCH_LIMIT_DEFAULT: 10,

  // Relevance score
  SCORE_MIN:            0,
  SCORE_MAX:            1,
  SCORE_MIN_DEFAULT:    0.5,

  // Context snapshot
  RECENT_MEMORIES_MAX:  5,
  TOP_TAGS_MAX:         10,
} as const
