/**
 * @file schemas/error.schema.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Standardized error envelope.
 * ALL errors returned by MindBridge services must use this shape.
 *
 * Example:
 * {
 *   "error": {
 *     "code": "INVALID_WORKSPACE",
 *     "message": "Workspace not found",
 *     "details": { "workspace": "unknown-space" }
 *   }
 * }
 */

import { z } from "zod"

// ─────────────────────────────────────────────
// Error code registry
// ─────────────────────────────────────────────

export const ERROR_CODES = {
  // Validation errors
  INVALID_REQUEST:       "INVALID_REQUEST",
  MISSING_FIELD:         "MISSING_FIELD",
  FIELD_TOO_LONG:        "FIELD_TOO_LONG",
  FIELD_OUT_OF_RANGE:    "FIELD_OUT_OF_RANGE",
  UNKNOWN_TOOL:          "UNKNOWN_TOOL",

  // Domain errors
  INVALID_WORKSPACE:     "INVALID_WORKSPACE",
  MEMORY_NOT_FOUND:      "MEMORY_NOT_FOUND",
  DUPLICATE_MEMORY:      "DUPLICATE_MEMORY",

  // System errors
  INTERNAL_ERROR:        "INTERNAL_ERROR",
  STORAGE_UNAVAILABLE:   "STORAGE_UNAVAILABLE",
  VERSION_MISMATCH:      "VERSION_MISMATCH",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// ─────────────────────────────────────────────
// Error body schema
// ─────────────────────────────────────────────

export const MCPErrorBodySchema = z.object({
  /** Machine-readable error code from ERROR_CODES. */
  code: z.string(),

  /** Human-readable description of what went wrong. */
  message: z.string(),

  /**
   * Optional structured details for debugging.
   * e.g. { "field": "query", "received": 501, "max": 500 }
   */
  details: z.record(z.string(), z.unknown()).optional(),
})

export type MCPErrorBody = z.infer<typeof MCPErrorBodySchema>

// ─────────────────────────────────────────────
// Full error envelope
// ─────────────────────────────────────────────

export const MCPErrorSchema = z.object({
  error: MCPErrorBodySchema,
})

export type MCPError = z.infer<typeof MCPErrorSchema>

// ─────────────────────────────────────────────
// Helper: build a typed error envelope
// ─────────────────────────────────────────────

/**
 * Creates a standards-compliant MCP error object.
 *
 * @example
 * throw makeMCPError("INVALID_WORKSPACE", "Workspace not found", { workspace: "x" })
 */
export function makeMCPError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): MCPError {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  }
}
