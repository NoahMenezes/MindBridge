

import {
  DeleteMemoryRequestSchema,
  DeleteMemoryResponseSchema,
} from "../types/api.types"
import { TOOL_NAMES } from "../constants/toolNames"

export const DELETE_MEMORY_TOOL = {
  name: TOOL_NAMES.DELETE_MEMORY,

  description:
    "Permanently delete a specific memory by ID from a workspace. " +
    "This action cannot be undone.",

  inputSchema:  DeleteMemoryRequestSchema,
  outputSchema: DeleteMemoryResponseSchema,

  examples: [
    {
      request: {
        id:        "mem_9f2a3c1d",
        workspace: "github.com",
      },
      response: {
        id:         "mem_9f2a3c1d",
        workspace:  "github.com",
        deleted_at: "2026-05-14T11:29:32+05:30",
        message:    "Memory deleted successfully.",
        version:    "1.0",
      },
    },
  ],
} as const
