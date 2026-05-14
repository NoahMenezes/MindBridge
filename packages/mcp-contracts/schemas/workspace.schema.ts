

import { z } from "zod"
import { LIMITS } from "../constants/limits"
import { MemoryResultSchema } from "./memory.schema"






export const WorkspaceIdSchema = z
  .string()
  .min(LIMITS.WORKSPACE_MIN)
  .max(LIMITS.WORKSPACE_MAX)

export type WorkspaceId = z.infer<typeof WorkspaceIdSchema>





export const TagFrequencySchema = z.object({
  tag:   z.string().min(1),
  count: z.number().int().nonnegative(),
})

export type TagFrequency = z.infer<typeof TagFrequencySchema>





export const WorkspaceContextSchema = z.object({
  
  workspace: WorkspaceIdSchema,

  
  total_memories: z.number().int().nonnegative(),

  
  last_updated: z.string().datetime({ offset: true }).nullable(),

  
  recent_memories: z.array(MemoryResultSchema).max(LIMITS.RECENT_MEMORIES_MAX),

  
  top_tags: z.array(TagFrequencySchema).max(LIMITS.TOP_TAGS_MAX),
})

export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>
