/**
 * @file tests/compatibility.test.ts
 * @owner Person 2A — MCP Protocol Engineer
 *
 * Contract compatibility tests — verifies that every tool's example
 * request/response pair actually passes its own schemas, and that
 * the tool registry is complete and correctly structured.
 *
 * Run: npx tsx --test packages/mcp-contracts/tests/compatibility.test.ts
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { ADD_MEMORY_TOOL }             from "../tools/add_memory"
import { SEARCH_MEMORIES_TOOL }        from "../tools/search_memories"
import { GET_WORKSPACE_CONTEXT_TOOL }  from "../tools/get_workspace_context"
import { DELETE_MEMORY_TOOL }          from "../tools/delete_memory"
import { TOOL_NAMES }                  from "../constants/toolNames"
import { CONTRACT_VERSION }            from "../constants/versions"
import { LIMITS }                      from "../constants/limits"

const ALL_TOOLS = [
  ADD_MEMORY_TOOL,
  SEARCH_MEMORIES_TOOL,
  GET_WORKSPACE_CONTEXT_TOOL,
  DELETE_MEMORY_TOOL,
] as const

// ─────────────────────────────────────────────
// Tool registry integrity
// ─────────────────────────────────────────────

describe("Tool registry", () => {
  it("exports exactly 4 tools", () => {
    assert.equal(ALL_TOOLS.length, 4)
  })

  it("all tool names match TOOL_NAMES constants", () => {
    const validNames = new Set(Object.values(TOOL_NAMES))
    for (const tool of ALL_TOOLS) {
      assert.ok(validNames.has(tool.name), `Unknown tool name: ${tool.name}`)
    }
  })

  it("all tools have a non-empty description", () => {
    for (const tool of ALL_TOOLS) {
      assert.ok(tool.description.length > 0, `Tool "${tool.name}" has no description`)
    }
  })

  it("all tools have inputSchema and outputSchema", () => {
    for (const tool of ALL_TOOLS) {
      assert.ok(tool.inputSchema, `Tool "${tool.name}" missing inputSchema`)
      assert.ok(tool.outputSchema, `Tool "${tool.name}" missing outputSchema`)
    }
  })

  it("all tools have at least one example", () => {
    for (const tool of ALL_TOOLS) {
      assert.ok(tool.examples.length > 0, `Tool "${tool.name}" has no examples`)
    }
  })
})

// ─────────────────────────────────────────────
// Example request/response compatibility
// ─────────────────────────────────────────────

describe("add_memory — example compatibility", () => {
  it("example request passes inputSchema", () => {
    for (const ex of ADD_MEMORY_TOOL.examples) {
      const result = ADD_MEMORY_TOOL.inputSchema.safeParse(ex.request)
      assert.ok(result.success, `Request failed: ${JSON.stringify(result)}`)
    }
  })

  it("example response passes outputSchema", () => {
    for (const ex of ADD_MEMORY_TOOL.examples) {
      const result = ADD_MEMORY_TOOL.outputSchema.safeParse(ex.response)
      assert.ok(result.success, `Response failed: ${JSON.stringify(result)}`)
    }
  })
})

describe("search_memories — example compatibility", () => {
  it("example request passes inputSchema", () => {
    for (const ex of SEARCH_MEMORIES_TOOL.examples) {
      const result = SEARCH_MEMORIES_TOOL.inputSchema.safeParse(ex.request)
      assert.ok(result.success, `Request failed: ${JSON.stringify(result)}`)
    }
  })

  it("example response passes outputSchema", () => {
    for (const ex of SEARCH_MEMORIES_TOOL.examples) {
      const result = SEARCH_MEMORIES_TOOL.outputSchema.safeParse(ex.response)
      assert.ok(result.success, `Response failed: ${JSON.stringify(result)}`)
    }
  })
})

describe("get_workspace_context — example compatibility", () => {
  it("example request passes inputSchema", () => {
    for (const ex of GET_WORKSPACE_CONTEXT_TOOL.examples) {
      const result = GET_WORKSPACE_CONTEXT_TOOL.inputSchema.safeParse(ex.request)
      assert.ok(result.success, `Request failed: ${JSON.stringify(result)}`)
    }
  })

  it("example response passes outputSchema", () => {
    for (const ex of GET_WORKSPACE_CONTEXT_TOOL.examples) {
      const result = GET_WORKSPACE_CONTEXT_TOOL.outputSchema.safeParse(ex.response)
      assert.ok(result.success, `Response failed: ${JSON.stringify(result)}`)
    }
  })
})

describe("delete_memory — example compatibility", () => {
  it("example request passes inputSchema", () => {
    for (const ex of DELETE_MEMORY_TOOL.examples) {
      const result = DELETE_MEMORY_TOOL.inputSchema.safeParse(ex.request)
      assert.ok(result.success, `Request failed: ${JSON.stringify(result)}`)
    }
  })

  it("example response passes outputSchema", () => {
    for (const ex of DELETE_MEMORY_TOOL.examples) {
      const result = DELETE_MEMORY_TOOL.outputSchema.safeParse(ex.response)
      assert.ok(result.success, `Response failed: ${JSON.stringify(result)}`)
    }
  })
})

// ─────────────────────────────────────────────
// Constants sanity checks
// ─────────────────────────────────────────────

describe("Constants sanity", () => {
  it("LIMITS are logically consistent", () => {
    assert.ok(LIMITS.SEARCH_LIMIT_MIN < LIMITS.SEARCH_LIMIT_MAX)
    assert.ok(LIMITS.SCORE_MIN < LIMITS.SCORE_MAX)
    assert.ok(LIMITS.QUERY_MIN < LIMITS.QUERY_MAX)
    assert.ok(LIMITS.MEMORY_CONTENT_MIN < LIMITS.MEMORY_CONTENT_MAX)
    assert.ok(LIMITS.SEARCH_LIMIT_DEFAULT >= LIMITS.SEARCH_LIMIT_MIN)
    assert.ok(LIMITS.SEARCH_LIMIT_DEFAULT <= LIMITS.SEARCH_LIMIT_MAX)
    assert.ok(LIMITS.SCORE_MIN_DEFAULT >= LIMITS.SCORE_MIN)
    assert.ok(LIMITS.SCORE_MIN_DEFAULT <= LIMITS.SCORE_MAX)
  })

  it("CONTRACT_VERSION is a non-empty string", () => {
    assert.ok(typeof CONTRACT_VERSION.CURRENT === "string")
    assert.ok(CONTRACT_VERSION.CURRENT.length > 0)
  })

  it("TOOL_NAMES has 4 entries", () => {
    assert.equal(Object.keys(TOOL_NAMES).length, 4)
  })
})
