/**
 * @file validation/query.validation.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Validates search_memories request payloads.
 */

import { ZodError } from "zod"
import { SearchMemoriesRequestSchema } from "../types/api.types"
import { makeMCPError, ERROR_CODES } from "../schemas/error.schema"
import type { MCPError } from "../schemas/error.schema"
import type { ValidationResult } from "./memory.validation"

function fromZodError(err: ZodError): MCPError {
  const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
  return makeMCPError(
    ERROR_CODES.INVALID_REQUEST,
    "Query validation failed.",
    { issues },
  )
}

export function validateSearchMemories(
  payload: unknown,
): ValidationResult<ReturnType<typeof SearchMemoriesRequestSchema.parse>> {
  const result = SearchMemoriesRequestSchema.safeParse(payload)
  if (!result.success) return { ok: false, error: fromZodError(result.error) }
  return { ok: true, data: result.data }
}
