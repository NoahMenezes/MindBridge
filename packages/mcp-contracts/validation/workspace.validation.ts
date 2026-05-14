/**
 * @file validation/workspace.validation.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Validates get_workspace_context request payloads.
 */

import { ZodError } from "zod"
import { GetWorkspaceContextRequestSchema } from "../types/api.types"
import { makeMCPError, ERROR_CODES } from "../schemas/error.schema"
import type { MCPError } from "../schemas/error.schema"
import type { ValidationResult } from "./memory.validation"

function fromZodError(err: ZodError): MCPError {
  const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
  return makeMCPError(
    ERROR_CODES.INVALID_REQUEST,
    "Workspace validation failed.",
    { issues },
  )
}

export function validateGetWorkspaceContext(
  payload: unknown,
): ValidationResult<ReturnType<typeof GetWorkspaceContextRequestSchema.parse>> {
  const result = GetWorkspaceContextRequestSchema.safeParse(payload)
  if (!result.success) return { ok: false, error: fromZodError(result.error) }
  return { ok: true, data: result.data }
}
