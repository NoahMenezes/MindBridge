/**
 * @file tools/get_workspace_context.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * MCP tool definition for `get_workspace_context`.
 * Returns an aggregated snapshot: total count, recent memories, top tags.
 */

import {
  GetWorkspaceContextRequestSchema,
  GetWorkspaceContextResponseSchema,
} from "../types/api.types"
import { TOOL_NAMES } from "../constants/toolNames"

export const GET_WORKSPACE_CONTEXT_TOOL = {
  name: TOOL_NAMES.GET_WORKSPACE_CONTEXT,

  description:
    "Retrieve an aggregated context snapshot for a workspace: " +
    "total memory count, recent memories, and top tags. " +
    'Use workspace "*" to get global context across all workspaces.',

  inputSchema:  GetWorkspaceContextRequestSchema,
  outputSchema: GetWorkspaceContextResponseSchema,

  examples: [
    {
      request: { workspace: "github.com" },
      response: {
        context: {
          workspace:       "github.com",
          total_memories:  42,
          last_updated:    "2026-05-14T11:29:32+05:30",
          recent_memories: [
            {
              id:        "mem_9f2a3c1d",
              workspace: "github.com",
              type:      "project" as const,
              summary:   "Discussed OAuth 2.0 PKCE flow.",
              content:   "Discussed OAuth 2.0 PKCE flow for MindBridge extension.",
              score:     1.0,
              tags:      ["auth"],
              timestamp: "2026-05-14T11:29:32+05:30",
            },
          ],
          top_tags: [
            { tag: "auth",     count: 8 },
            { tag: "security", count: 5 },
          ],
        },
        version: "1.0",
      },
    },
  ],
} as const
