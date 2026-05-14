

export const TOOL_NAMES = {
  ADD_MEMORY:            "add_memory",
  SEARCH_MEMORIES:       "search_memories",
  GET_WORKSPACE_CONTEXT: "get_workspace_context",
  DELETE_MEMORY:         "delete_memory",
} as const


export type MCPToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES]
