/**
 * @file tests/validation.test.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Tests for the validation layer (validation/*.validation.ts).
 * Confirms that validation functions return MCPError envelopes on failure.
 * Run: npx tsx --test packages/mcp-contracts/tests/validation.test.ts
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { validateAddMemory, validateDeleteMemory } from "../validation/memory.validation"
import { validateSearchMemories } from "../validation/query.validation"
import { validateGetWorkspaceContext } from "../validation/workspace.validation"

// ─────────────────────────────────────────────
// add_memory validation
// ─────────────────────────────────────────────

describe("validateAddMemory", () => {
  it("returns ok:true for a valid payload", () => {
    const result = validateAddMemory({ content: "Hello", workspace: "x.com" })
    assert.equal(result.ok, true)
  })

  it("returns ok:false with error envelope for missing content", () => {
    const result = validateAddMemory({ workspace: "x.com" })
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.ok(result.error.error.code)
      assert.ok(result.error.error.message)
    }
  })

  it("returns ok:false for missing workspace", () => {
    const result = validateAddMemory({ content: "hi" })
    assert.equal(result.ok, false)
  })

  it("returns ok:false for empty content", () => {
    const result = validateAddMemory({ content: "", workspace: "x.com" })
    assert.equal(result.ok, false)
  })

  it("defaults type to 'note' when omitted", () => {
    const result = validateAddMemory({ content: "test", workspace: "x.com" })
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.data.type, "note")
  })

  it("returns ok:false for non-object payload", () => {
    const result = validateAddMemory(null)
    assert.equal(result.ok, false)
  })
})

// ─────────────────────────────────────────────
// delete_memory validation
// ─────────────────────────────────────────────

describe("validateDeleteMemory", () => {
  it("returns ok:true for a valid payload", () => {
    const result = validateDeleteMemory({ id: "mem_001", workspace: "github.com" })
    assert.equal(result.ok, true)
  })

  it("returns ok:false for missing id", () => {
    const result = validateDeleteMemory({ workspace: "github.com" })
    assert.equal(result.ok, false)
  })

  it("returns ok:false for empty id", () => {
    const result = validateDeleteMemory({ id: "", workspace: "github.com" })
    assert.equal(result.ok, false)
  })

  it("returns ok:false for missing workspace", () => {
    const result = validateDeleteMemory({ id: "mem_001" })
    assert.equal(result.ok, false)
  })
})

// ─────────────────────────────────────────────
// search_memories validation
// ─────────────────────────────────────────────

describe("validateSearchMemories", () => {
  it("returns ok:true for a valid payload", () => {
    const result = validateSearchMemories({ query: "auth flow", workspace: "github.com" })
    assert.equal(result.ok, true)
  })

  it("returns ok:false for missing query", () => {
    const result = validateSearchMemories({ workspace: "x.com" })
    assert.equal(result.ok, false)
  })

  it("returns ok:false for query > 500 chars", () => {
    const result = validateSearchMemories({ query: "q".repeat(501), workspace: "x.com" })
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.ok(result.error.error.details)
    }
  })

  it("returns ok:false for limit out of range", () => {
    const result = validateSearchMemories({ query: "x", workspace: "x.com", limit: 99 })
    assert.equal(result.ok, false)
  })

  it("applies defaults and returns ok:true", () => {
    const result = validateSearchMemories({ query: "test", workspace: "*" })
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.data.limit, 10)
      assert.equal(result.data.min_score, 0.5)
    }
  })
})

// ─────────────────────────────────────────────
// get_workspace_context validation
// ─────────────────────────────────────────────

describe("validateGetWorkspaceContext", () => {
  it("returns ok:true for a valid payload", () => {
    const result = validateGetWorkspaceContext({ workspace: "github.com" })
    assert.equal(result.ok, true)
  })

  it('returns ok:true for workspace "*"', () => {
    const result = validateGetWorkspaceContext({ workspace: "*" })
    assert.equal(result.ok, true)
  })

  it("returns ok:false for missing workspace", () => {
    const result = validateGetWorkspaceContext({})
    assert.equal(result.ok, false)
  })

  it("returns ok:false for empty workspace", () => {
    const result = validateGetWorkspaceContext({ workspace: "" })
    assert.equal(result.ok, false)
  })
})
