/**
 * @file tests/schema.test.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Tests that every Zod schema correctly accepts valid data and rejects invalid data.
 * Run: npx tsx --test packages/mcp-contracts/tests/schema.test.ts
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { MemorySchema, MemoryResultSchema, MemoryTypeSchema } from "../schemas/memory.schema"
import { WorkspaceContextSchema, WorkspaceIdSchema } from "../schemas/workspace.schema"
import { SearchQuerySchema } from "../schemas/query.schema"
import { MCPErrorSchema, makeMCPError, ERROR_CODES } from "../schemas/error.schema"
import { LIMITS } from "../constants/limits"

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const VALID_MEMORY = {
  id:        "mem_001",
  workspace: "github.com",
  type:      "project" as const,
  summary:   "OAuth flow discussion",
  content:   "We discussed OAuth 2.0 PKCE.",
  tags:      ["auth"],
  timestamp: "2026-05-14T11:29:32+05:30",
}

const VALID_MEMORY_RESULT = { ...VALID_MEMORY, score: 0.92 }

// ─────────────────────────────────────────────
// MemoryTypeSchema
// ─────────────────────────────────────────────

describe("MemoryTypeSchema", () => {
  it("accepts all valid types", () => {
    const types = ["project", "preference", "goal", "collaborator", "note", "context"]
    for (const t of types) {
      assert.ok(MemoryTypeSchema.safeParse(t).success, `Expected "${t}" to be valid`)
    }
  })

  it("rejects unknown types", () => {
    assert.equal(MemoryTypeSchema.safeParse("random").success, false)
  })
})

// ─────────────────────────────────────────────
// MemorySchema
// ─────────────────────────────────────────────

describe("MemorySchema", () => {
  it("accepts a valid memory object", () => {
    assert.ok(MemorySchema.safeParse(VALID_MEMORY).success)
  })

  it("rejects missing id", () => {
    const { id: _, ...rest } = VALID_MEMORY
    assert.equal(MemorySchema.safeParse(rest).success, false)
  })

  it("rejects empty summary", () => {
    assert.equal(MemorySchema.safeParse({ ...VALID_MEMORY, summary: "" }).success, false)
  })

  it("rejects summary exceeding max length", () => {
    assert.equal(
      MemorySchema.safeParse({ ...VALID_MEMORY, summary: "x".repeat(LIMITS.MEMORY_SUMMARY_MAX + 1) }).success,
      false,
    )
  })

  it("rejects content exceeding max length", () => {
    assert.equal(
      MemorySchema.safeParse({ ...VALID_MEMORY, content: "x".repeat(LIMITS.MEMORY_CONTENT_MAX + 1) }).success,
      false,
    )
  })

  it("rejects too many tags", () => {
    assert.equal(
      MemorySchema.safeParse({ ...VALID_MEMORY, tags: Array(LIMITS.TAGS_MAX_COUNT + 1).fill("tag") }).success,
      false,
    )
  })

  it("defaults tags to []", () => {
    const { tags: _, ...rest } = VALID_MEMORY
    const result = MemorySchema.safeParse(rest)
    assert.ok(result.success)
    assert.deepEqual(result.data?.tags, [])
  })

  it("rejects invalid timestamp format", () => {
    assert.equal(MemorySchema.safeParse({ ...VALID_MEMORY, timestamp: "not-a-date" }).success, false)
  })
})

// ─────────────────────────────────────────────
// MemoryResultSchema
// ─────────────────────────────────────────────

describe("MemoryResultSchema", () => {
  it("accepts a memory result with score", () => {
    assert.ok(MemoryResultSchema.safeParse(VALID_MEMORY_RESULT).success)
  })

  it("rejects score above 1", () => {
    assert.equal(MemoryResultSchema.safeParse({ ...VALID_MEMORY_RESULT, score: 1.1 }).success, false)
  })

  it("rejects score below 0", () => {
    assert.equal(MemoryResultSchema.safeParse({ ...VALID_MEMORY_RESULT, score: -0.1 }).success, false)
  })

  it("rejects missing score", () => {
    assert.equal(MemoryResultSchema.safeParse(VALID_MEMORY).success, false)
  })
})

// ─────────────────────────────────────────────
// WorkspaceIdSchema
// ─────────────────────────────────────────────

describe("WorkspaceIdSchema", () => {
  it('accepts "*" for global', () => {
    assert.ok(WorkspaceIdSchema.safeParse("*").success)
  })

  it("accepts a hostname workspace", () => {
    assert.ok(WorkspaceIdSchema.safeParse("github.com").success)
  })

  it("rejects empty string", () => {
    assert.equal(WorkspaceIdSchema.safeParse("").success, false)
  })

  it("rejects workspace exceeding max length", () => {
    assert.equal(WorkspaceIdSchema.safeParse("x".repeat(LIMITS.WORKSPACE_MAX + 1)).success, false)
  })
})

// ─────────────────────────────────────────────
// SearchQuerySchema
// ─────────────────────────────────────────────

describe("SearchQuerySchema", () => {
  it("accepts a minimal valid query", () => {
    assert.ok(SearchQuerySchema.safeParse({ query: "auth flow", workspace: "github.com" }).success)
  })

  it("applies default limit and min_score", () => {
    const result = SearchQuerySchema.safeParse({ query: "auth", workspace: "github.com" })
    assert.ok(result.success)
    assert.equal(result.data?.limit, LIMITS.SEARCH_LIMIT_DEFAULT)
    assert.equal(result.data?.min_score, LIMITS.SCORE_MIN_DEFAULT)
  })

  it("rejects query exceeding 500 chars", () => {
    assert.equal(
      SearchQuerySchema.safeParse({ query: "q".repeat(501), workspace: "x" }).success,
      false,
    )
  })

  it("rejects limit = 0", () => {
    assert.equal(
      SearchQuerySchema.safeParse({ query: "x", workspace: "x", limit: 0 }).success,
      false,
    )
  })

  it("rejects limit = 51", () => {
    assert.equal(
      SearchQuerySchema.safeParse({ query: "x", workspace: "x", limit: 51 }).success,
      false,
    )
  })

  it("rejects min_score = 1.1", () => {
    assert.equal(
      SearchQuerySchema.safeParse({ query: "x", workspace: "x", min_score: 1.1 }).success,
      false,
    )
  })
})

// ─────────────────────────────────────────────
// Error schema + makeMCPError helper
// ─────────────────────────────────────────────

describe("MCPErrorSchema + makeMCPError", () => {
  it("makeMCPError produces a valid error envelope", () => {
    const err = makeMCPError("INVALID_WORKSPACE", "Workspace not found", { workspace: "x" })
    assert.ok(MCPErrorSchema.safeParse(err).success)
    assert.equal(err.error.code, "INVALID_WORKSPACE")
    assert.equal(err.error.message, "Workspace not found")
    assert.deepEqual(err.error.details, { workspace: "x" })
  })

  it("makeMCPError works without details", () => {
    const err = makeMCPError("INTERNAL_ERROR", "Something went wrong")
    assert.ok(MCPErrorSchema.safeParse(err).success)
    assert.equal(err.error.details, undefined)
  })

  it("ERROR_CODES contains expected keys", () => {
    assert.ok(ERROR_CODES.INVALID_WORKSPACE)
    assert.ok(ERROR_CODES.MEMORY_NOT_FOUND)
    assert.ok(ERROR_CODES.INTERNAL_ERROR)
    assert.ok(ERROR_CODES.INVALID_REQUEST)
    assert.ok(ERROR_CODES.VERSION_MISMATCH)
  })
})
