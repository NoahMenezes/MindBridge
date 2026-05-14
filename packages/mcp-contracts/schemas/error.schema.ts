

import { z } from "zod"





export const ERROR_CODES = {
  
  INVALID_REQUEST:       "INVALID_REQUEST",
  MISSING_FIELD:         "MISSING_FIELD",
  FIELD_TOO_LONG:        "FIELD_TOO_LONG",
  FIELD_OUT_OF_RANGE:    "FIELD_OUT_OF_RANGE",
  UNKNOWN_TOOL:          "UNKNOWN_TOOL",

  
  INVALID_WORKSPACE:     "INVALID_WORKSPACE",
  MEMORY_NOT_FOUND:      "MEMORY_NOT_FOUND",
  DUPLICATE_MEMORY:      "DUPLICATE_MEMORY",

  
  INTERNAL_ERROR:        "INTERNAL_ERROR",
  STORAGE_UNAVAILABLE:   "STORAGE_UNAVAILABLE",
  VERSION_MISMATCH:      "VERSION_MISMATCH",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]





export const MCPErrorBodySchema = z.object({
  
  code: z.string(),

  
  message: z.string(),

  
  details: z.record(z.string(), z.unknown()).optional(),
})

export type MCPErrorBody = z.infer<typeof MCPErrorBodySchema>





export const MCPErrorSchema = z.object({
  error: MCPErrorBodySchema,
})

export type MCPError = z.infer<typeof MCPErrorSchema>






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
