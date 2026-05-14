/**
 * @file constants/versions.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * MCP contract versioning.
 *
 * Bump CURRENT_VERSION whenever a breaking change is made.
 * Add an entry to CHANGELOG below with a date and description.
 * Notify all team owners before releasing a breaking version.
 */

export const CONTRACT_VERSION = {
  /** Current contract version included in all API responses. */
  CURRENT: "1.0",

  /** Oldest version still supported (for compatibility checks). */
  MIN_SUPPORTED: "1.0",
} as const

/**
 * Version changelog — append only, never delete entries.
 *
 * Format: { version, date, changes[] }
 */
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
