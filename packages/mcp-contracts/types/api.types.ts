

import { z } from "zod"
import {
  MemorySchema,
  MemoryResultSchema,
} from "../schemas/memory.schema"
import { WorkspaceContextSchema } from "../schemas/workspace.schema"
import { SearchQuerySchema } from "../schemas/query.schema"
import { MCPErrorSchema } from "../schemas/error.schema"
import { LIMITS } from "../constants/limits"
import { WorkspaceIdSchema } from "../schemas/workspace.schema"





export const AddMemoryRequestSchema = z.object({
  content:   z.string().min(LIMITS.MEMORY_CONTENT_MIN).max(LIMITS.MEMORY_CONTENT_MAX),
  workspace: WorkspaceIdSchema,
  type:      MemorySchema.shape.type.default("note"),
  tags:      MemorySchema.shape.tags,
})

export const AddMemoryResponseSchema = z.object({
  id:         z.string(),
  workspace:  WorkspaceIdSchema,
  type:       MemorySchema.shape.type,
  tags:       MemorySchema.shape.tags,
  created_at: z.string().datetime({ offset: true }),
  message:    z.string(),
  version:    z.string(),
})

export type AddMemoryRequest  = z.infer<typeof AddMemoryRequestSchema>
export type AddMemoryResponse = z.infer<typeof AddMemoryResponseSchema>





export const SearchMemoriesRequestSchema  = SearchQuerySchema
export const SearchMemoriesResponseSchema = z.object({
  memories:  z.array(MemoryResultSchema),
  count:     z.number().int().nonnegative(),
  query:     z.string(),
  workspace: WorkspaceIdSchema,
  version:   z.string(),
})

export type SearchMemoriesRequest  = z.infer<typeof SearchMemoriesRequestSchema>
export type SearchMemoriesResponse = z.infer<typeof SearchMemoriesResponseSchema>





export const GetWorkspaceContextRequestSchema = z.object({
  workspace: WorkspaceIdSchema,
})

export const GetWorkspaceContextResponseSchema = z.object({
  context: WorkspaceContextSchema,
  version: z.string(),
})

export type GetWorkspaceContextRequest  = z.infer<typeof GetWorkspaceContextRequestSchema>
export type GetWorkspaceContextResponse = z.infer<typeof GetWorkspaceContextResponseSchema>





export const DeleteMemoryRequestSchema = z.object({
  id:        z.string().min(1),
  workspace: WorkspaceIdSchema,
})

export const DeleteMemoryResponseSchema = z.object({
  id:         z.string(),
  workspace:  WorkspaceIdSchema,
  deleted_at: z.string().datetime({ offset: true }),
  message:    z.string(),
  version:    z.string(),
})

export type DeleteMemoryRequest  = z.infer<typeof DeleteMemoryRequestSchema>
export type DeleteMemoryResponse = z.infer<typeof DeleteMemoryResponseSchema>





export type { MCPError, MCPErrorBody, ErrorCode } from "../schemas/error.schema"





export type MCPResult<T> =
  | ({ ok: true }  & T)
  | ({ ok: false } & z.infer<typeof MCPErrorSchema>)
