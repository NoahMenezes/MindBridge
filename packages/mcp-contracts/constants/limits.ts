

export const LIMITS = {
  
  MEMORY_CONTENT_MIN:   1,
  MEMORY_CONTENT_MAX:   10_000,
  MEMORY_SUMMARY_MIN:   1,
  MEMORY_SUMMARY_MAX:   500,

  
  TAG_MIN_LENGTH:       1,
  TAG_MAX_LENGTH:       64,
  TAGS_MAX_COUNT:       20,

  
  WORKSPACE_MIN:        1,
  WORKSPACE_MAX:        256,

  
  QUERY_MIN:            1,
  QUERY_MAX:            500,

  
  SEARCH_LIMIT_MIN:     1,
  SEARCH_LIMIT_MAX:     50,
  SEARCH_LIMIT_DEFAULT: 10,

  
  SCORE_MIN:            0,
  SCORE_MAX:            1,
  SCORE_MIN_DEFAULT:    0.5,

  
  RECENT_MEMORIES_MAX:  5,
  TOP_TAGS_MAX:         10,
} as const
