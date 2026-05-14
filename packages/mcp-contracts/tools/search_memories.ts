

import { SearchMemoriesRequestSchema, SearchMemoriesResponseSchema } from "../types/api.types"
import { TOOL_NAMES } from "../constants/toolNames"

export const SEARCH_MEMORIES_TOOL = {
  name: TOOL_NAMES.SEARCH_MEMORIES,

  description:
    "Semantic search over stored memories for a given workspace. " +
    "Returns the most relevant memories ranked by similarity score (0–1). " +
    'Use workspace "*" to search globally across all workspaces.',

  inputSchema:  SearchMemoriesRequestSchema,
  outputSchema: SearchMemoriesResponseSchema,

  examples: [
    {
      request: {
        query:     "continue auth flow",
        workspace: "startup",
        limit:     5,
        min_score: 0.7,
      },
      response: {
        memories: [
          {
            id:        "mem_001",
            workspace: "startup",
            type:      "project" as const,
            summary:   "React fintech dashboard",
            content:   "Building a React fintech dashboard with JWT auth and OAuth 2.0 PKCE.",
            score:     0.93,
            tags:      ["react", "auth"],
            timestamp: "2026-05-14T11:29:32+05:30",
          },
        ],
        count:     1,
        query:     "continue auth flow",
        workspace: "startup",
        version:   "1.0",
      },
    },
  ],
} as const
