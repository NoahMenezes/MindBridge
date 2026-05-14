/**
 * @file constants/toolNames.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Canonical MCP tool name constants.
 * NEVER hardcode tool name strings anywhere else in the codebase.
 * Always import from here.
 */

export const TOOL_NAMES = {
  ADD_MEMORY:            "add_memory",
  SEARCH_MEMORIES:       "search_memories",
  GET_WORKSPACE_CONTEXT: "get_workspace_context",
  DELETE_MEMORY:         "delete_memory",
} as const

/** Union of all valid MCP tool name strings. */
export type MCPToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES]
