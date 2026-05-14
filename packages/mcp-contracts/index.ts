/**
 * @file index.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Public API of mcp-contracts.
 * All consumers (extension, backend, retrieval engine) import from this barrel.
 *
 * @example
 * import { SEARCH_MEMORIES_TOOL, validateSearchMemories } from "../../packages/mcp-contracts"
 * import type { SearchMemoriesRequest, Memory } from "../../packages/mcp-contracts"
 */

// ── Constants ──────────────────────────────────────────────────────────────
export { TOOL_NAMES }          from "./constants/toolNames"
export type { MCPToolName }    from "./constants/toolNames"
export { LIMITS }              from "./constants/limits"
export { CONTRACT_VERSION, VERSION_CHANGELOG } from "./constants/versions"
export type { ContractVersion } from "./constants/versions"

// ── Schemas (Zod objects — for validation) ────────────────────────────────
export { MemorySchema, MemoryResultSchema, MemoryTypeSchema } from "./schemas/memory.schema"
export { WorkspaceContextSchema, WorkspaceIdSchema }         from "./schemas/workspace.schema"
export { SearchQuerySchema }                                 from "./schemas/query.schema"
export {
  MCPErrorSchema,
  MCPErrorBodySchema,
  ERROR_CODES,
  makeMCPError,
}                                                            from "./schemas/error.schema"

// ── Types (inferred from schemas — for TypeScript consumers) ──────────────
export type { Memory, MemoryResult, MemoryType }             from "./types/memory.types"
export type { WorkspaceId, TagFrequency, WorkspaceContext }  from "./types/workspace.types"
export type {
  AddMemoryRequest,
  AddMemoryResponse,
  SearchMemoriesRequest,
  SearchMemoriesResponse,
  GetWorkspaceContextRequest,
  GetWorkspaceContextResponse,
  DeleteMemoryRequest,
  DeleteMemoryResponse,
  MCPError,
  MCPErrorBody,
  ErrorCode,
  MCPResult,
}                                                            from "./types/api.types"
export {
  AddMemoryRequestSchema,
  AddMemoryResponseSchema,
  SearchMemoriesRequestSchema,
  SearchMemoriesResponseSchema,
  GetWorkspaceContextRequestSchema,
  GetWorkspaceContextResponseSchema,
  DeleteMemoryRequestSchema,
  DeleteMemoryResponseSchema,
}                                                            from "./types/api.types"

// ── Tool definitions ───────────────────────────────────────────────────────
export { ADD_MEMORY_TOOL }            from "./tools/add_memory"
export { SEARCH_MEMORIES_TOOL }       from "./tools/search_memories"
export { GET_WORKSPACE_CONTEXT_TOOL } from "./tools/get_workspace_context"
export { DELETE_MEMORY_TOOL }         from "./tools/delete_memory"

// ── Validation functions ───────────────────────────────────────────────────
export {
  validateAddMemory,
  validateDeleteMemory,
}                                     from "./validation/memory.validation"
export type { ValidationResult, ValidationOk, ValidationErr } from "./validation/memory.validation"
export { validateSearchMemories }     from "./validation/query.validation"
export { validateGetWorkspaceContext } from "./validation/workspace.validation"
