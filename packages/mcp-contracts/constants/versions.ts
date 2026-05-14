

export const CONTRACT_VERSION = {
  
  CURRENT: "1.0",

  
  MIN_SUPPORTED: "1.0",
} as const


export const VERSION_CHANGELOG = [
  {
    version: "1.0",
    date: "2026-05-14",
    changes: [
      "Initial contract — add_memory, search_memories, get_workspace_context, delete_memory",
      "Zod-based schema validation with LIMITS constants",
      "Standardized error envelope { error: { code, message, details? } }",
    ],
  },
] as const

export type ContractVersion = typeof CONTRACT_VERSION.CURRENT
