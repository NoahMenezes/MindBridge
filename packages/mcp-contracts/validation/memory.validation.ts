/**
 * @file validation/memory.validation.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Validates add_memory and delete_memory request payloads.
 */

import { ZodError } from "zod"
import { AddMemoryRequestSchema, DeleteMemoryRequestSchema } from "../types/api.types"
import { makeMCPError, ERROR_CODES } from "../schemas/error.schema"
import type { MCPError } from "../schemas/error.schema"

// ─────────────────────────────────────────────
// Validation result
// ─────────────────────────────────────────────

export type ValidationOk<T>  = { ok: true;  data: T }
export type ValidationErr    = { ok: false; error: MCPError }
export type ValidationResult<T> = ValidationOk<T> | ValidationErr

function fromZodError(err: ZodError): MCPError {
  const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
  return makeMCPError(
    ERROR_CODES.INVALID_REQUEST,
    "Request validation failed.",
    { issues },
  )
}

// ─────────────────────────────────────────────
// add_memory
// ─────────────────────────────────────────────

export function validateAddMemory(
  payload: unknown,
): ValidationResult<ReturnType<typeof AddMemoryRequestSchema.parse>> {
  const result = AddMemoryRequestSchema.safeParse(payload)
  if (!result.success) return { ok: false, error: fromZodError(result.error) }
  return { ok: true, data: result.data }
}

// ─────────────────────────────────────────────
// delete_memory
// ─────────────────────────────────────────────

export function validateDeleteMemory(
  payload: unknown,
): ValidationResult<ReturnType<typeof DeleteMemoryRequestSchema.parse>> {
  const result = DeleteMemoryRequestSchema.safeParse(payload)
  if (!result.success) return { ok: false, error: fromZodError(result.error) }
  return { ok: true, data: result.data }
}
