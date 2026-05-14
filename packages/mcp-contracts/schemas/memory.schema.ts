/**
 * @file schemas/memory.schema.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Core Memory schema — the single most important schema in the system.
 * Every layer (extension, backend, retrieval) imports from here.
 *
 * Rule: "workspaceId" vs "workspace" drift ends here. It's always `workspace`.
 */

import { z } from "zod"
import { LIMITS } from "../constants/limits"

// ─────────────────────────────────────────────
// Memory type enum
// ─────────────────────────────────────────────

export const MemoryTypeSchema = z.enum([
  "project",
  "preference",
  "goal",
  "collaborator",
  "note",
  "context",
])

export type MemoryType = z.infer<typeof MemoryTypeSchema>

// ─────────────────────────────────────────────
// Core memory record (stored/retrieved)
// ─────────────────────────────────────────────

export const MemorySchema = z.object({
  /** Unique memory identifier, e.g. "mem_9f2a3c1d". */
  id: z.string().min(1),

  /** Workspace this memory belongs to. Always `workspace`, never `workspaceId`. */
  workspace: z.string().min(LIMITS.WORKSPACE_MIN).max(LIMITS.WORKSPACE_MAX),

  /** Category of memory for retrieval filtering. */
  type: MemoryTypeSchema,

  /** Condensed human-readable summary of the memory content. */
  summary: z
    .string()
    .min(LIMITS.MEMORY_SUMMARY_MIN)
    .max(LIMITS.MEMORY_SUMMARY_MAX),

  /** Full original content that was stored. */
  content: z
    .string()
    .min(LIMITS.MEMORY_CONTENT_MIN)
    .max(LIMITS.MEMORY_CONTENT_MAX),

  /**
   * Relevance score — only present in search results.
   * Range: [0, 1]. Omit when returning a stored record directly.
   */
  score: z.number().min(LIMITS.SCORE_MIN).max(LIMITS.SCORE_MAX).optional(),

  /** Classification tags. */
  tags: z
    .array(z.string().min(LIMITS.TAG_MIN_LENGTH).max(LIMITS.TAG_MAX_LENGTH))
    .max(LIMITS.TAGS_MAX_COUNT)
    .default([]),

  /** ISO-8601 creation timestamp. */
  timestamp: z.string().datetime({ offset: true }),
})

export type Memory = z.infer<typeof MemorySchema>

// ─────────────────────────────────────────────
// Search result variant (score is required)
// ─────────────────────────────────────────────

export const MemoryResultSchema = MemorySchema.extend({
  score: z.number().min(LIMITS.SCORE_MIN).max(LIMITS.SCORE_MAX),
})

export type MemoryResult = z.infer<typeof MemoryResultSchema>
