/**
 * @file schemas/workspace.schema.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Workspace-related schemas: context snapshots and tag frequency objects.
 */

import { z } from "zod"
import { LIMITS } from "../constants/limits"
import { MemoryResultSchema } from "./memory.schema"

// ─────────────────────────────────────────────
// Workspace identifier
// ─────────────────────────────────────────────

/**
 * A valid workspace string.
 * Use literal "*" to target all workspaces.
 */
export const WorkspaceIdSchema = z
  .string()
  .min(LIMITS.WORKSPACE_MIN)
  .max(LIMITS.WORKSPACE_MAX)

export type WorkspaceId = z.infer<typeof WorkspaceIdSchema>

// ─────────────────────────────────────────────
// Tag frequency entry
// ─────────────────────────────────────────────

export const TagFrequencySchema = z.object({
  tag:   z.string().min(1),
  count: z.number().int().nonnegative(),
})

export type TagFrequency = z.infer<typeof TagFrequencySchema>

// ─────────────────────────────────────────────
// Workspace context snapshot
// ─────────────────────────────────────────────

export const WorkspaceContextSchema = z.object({
  /** Workspace identifier (or "*" for global). */
  workspace: WorkspaceIdSchema,

  /** Total number of memories stored in this workspace. */
  total_memories: z.number().int().nonnegative(),

  /** ISO-8601 timestamp of the most recently added memory, or null if empty. */
  last_updated: z.string().datetime({ offset: true }).nullable(),

  /**
   * Most recent memories (newest first).
   * @maxItems LIMITS.RECENT_MEMORIES_MAX
   */
  recent_memories: z.array(MemoryResultSchema).max(LIMITS.RECENT_MEMORIES_MAX),

  /**
   * Frequency-ranked tags used in this workspace.
   * @maxItems LIMITS.TOP_TAGS_MAX
   */
  top_tags: z.array(TagFrequencySchema).max(LIMITS.TOP_TAGS_MAX),
})

export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>
