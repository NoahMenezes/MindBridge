/**
 * @file tools/add_memory.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * MCP tool definition for `add_memory`.
 */

import { AddMemoryRequestSchema, AddMemoryResponseSchema } from "../types/api.types"
import { TOOL_NAMES } from "../constants/toolNames"

export const ADD_MEMORY_TOOL = {
  name: TOOL_NAMES.ADD_MEMORY,

  description:
    "Store a new memory for the current workspace. " +
    "Call this whenever meaningful context should be persisted " +
    "for future AI interactions.",

  inputSchema:  AddMemoryRequestSchema,
  outputSchema: AddMemoryResponseSchema,

  examples: [
    {
      request: {
        content:   "Discussed OAuth 2.0 PKCE flow for the MindBridge extension.",
        workspace: "github.com",
        type:      "project" as const,
        tags:      ["auth", "security"],
      },
      response: {
        id:         "mem_9f2a3c1d",
        workspace:  "github.com",
        type:       "project" as const,
        tags:       ["auth", "security"],
        created_at: "2026-05-14T11:29:32+05:30",
        message:    "Memory stored successfully.",
        version:    "1.0",
      },
    },
  ],
} as const
