

import * as readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

import { validateAddMemory, validateDeleteMemory } from "./validation/memory.validation"
import { validateSearchMemories }                  from "./validation/query.validation"
import { validateGetWorkspaceContext }             from "./validation/workspace.validation"
import { TOOL_NAMES }                             from "./constants/toolNames"
import { CONTRACT_VERSION }                       from "./constants/versions"
import { LIMITS }                                 from "./constants/limits"





const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  blue:   "\x1b[34m",
  magenta:"\x1b[35m",
}

function green (s: string) { return `${c.green}${c.bold}${s}${c.reset}` }
function red   (s: string) { return `${c.red}${c.bold}${s}${c.reset}` }
function cyan  (s: string) { return `${c.cyan}${s}${c.reset}` }
function dim   (s: string) { return `${c.dim}${s}${c.reset}` }
function bold  (s: string) { return `${c.bold}${s}${c.reset}` }
function yellow(s: string) { return `${c.yellow}${s}${c.reset}` }





const TOOLS = {
  "1": { name: TOOL_NAMES.ADD_MEMORY,            fn: validateAddMemory },
  "2": { name: TOOL_NAMES.SEARCH_MEMORIES,       fn: validateSearchMemories },
  "3": { name: TOOL_NAMES.GET_WORKSPACE_CONTEXT, fn: validateGetWorkspaceContext },
  "4": { name: TOOL_NAMES.DELETE_MEMORY,         fn: validateDeleteMemory },
} as const

const DEFAULT_PAYLOADS: Record<string, object> = {
  "1": {
    content:   "Discussed OAuth 2.0 PKCE flow for MindBridge.",
    workspace: "github.com",
    type:      "project",
    tags:      ["auth", "security"],
  },
  "2": {
    query:     "continue auth flow",
    workspace: "startup",
    limit:     5,
    min_score: 0.7,
  },
  "3": {
    workspace: "github.com",
  },
  "4": {
    id:        "mem_9f2a3c1d",
    workspace: "github.com",
  },
}





function printHeader() {
  console.clear()
  console.log()
  console.log(bold(`  ╔══════════════════════════════════════════════╗`))
  console.log(bold(`  ║`) + cyan(`  MindBridge MCP Contracts Playground`) + bold(`         ║`))
  console.log(bold(`  ║`) + dim(`  Contract v${CONTRACT_VERSION.CURRENT} — Person 2A Authority`) + bold(`       ║`))
  console.log(bold(`  ╚══════════════════════════════════════════════╝`))
  console.log()
}

function printLimits() {
  console.log(dim("  Key limits:") +
    dim(` query≤${LIMITS.QUERY_MAX}chars`) + " · " +
    dim(`score 0–1`) + " · " +
    dim(`limit 1–${LIMITS.SEARCH_LIMIT_MAX}`) + " · " +
    dim(`content≤${LIMITS.MEMORY_CONTENT_MAX}chars`))
  console.log()
}





async function main() {
  const rl = readline.createInterface({ input, output })

  while (true) {
    printHeader()
    printLimits()

    
    console.log(bold("  Pick a tool to test:"))
    for (const [key, tool] of Object.entries(TOOLS)) {
      console.log(`    ${cyan(key)}) ${tool.name}`)
    }
    console.log(`    ${cyan("q")}) Quit`)
    console.log()

    const choice = (await rl.question("  → ")).trim().toLowerCase()

    if (choice === "q" || choice === "quit") {
      console.log(dim("\n  Goodbye.\n"))
      rl.close()
      break
    }

    if (!(choice in TOOLS)) {
      console.log(red("  Invalid choice. Press Enter to retry."))
      await rl.question("")
      continue
    }

    const selected = TOOLS[choice as keyof typeof TOOLS]
    const defaultPayload = JSON.stringify(DEFAULT_PAYLOADS[choice], null, 2)

    console.log()
    console.log(bold(`  Tool: `) + cyan(selected.name))
    console.log(dim("  Paste your JSON payload below (or press Enter to use the default):"))
    console.log(dim("  (For multi-line JSON, type END on its own line when done)"))
    console.log()
    console.log(dim("  Default payload:"))
    console.log(dim(defaultPayload.split("\n").map(l => "    " + l).join("\n")))
    console.log()

    
    let rawLines: string[] = []
    let line = await rl.question("  > ")

    if (line.trim() === "") {
      
      rawLines = [defaultPayload]
    } else {
      rawLines.push(line)
      while (true) {
        const next = await rl.question("  > ")
        if (next.trim() === "END") break
        rawLines.push(next)
      }
    }

    const raw = rawLines.join("\n")

    console.log()
    console.log("  " + "─".repeat(50))

    
    let payload: unknown
    try {
      payload = JSON.parse(raw)
    } catch {
      console.log(red("  ✗ JSON parse error — check your syntax."))
      await rl.question(dim("\n  Press Enter to continue..."))
      continue
    }

    
    
    const result = (selected.fn as (p: unknown) => any)(payload)

    console.log()
    if (result.ok) {
      console.log(green("  ✔ VALID"))
      console.log(dim("  Parsed & coerced data:"))
      console.log(
        JSON.stringify(result.data, null, 2)
          .split("\n")
          .map(l => "    " + l)
          .join("\n"),
      )
    } else {
      console.log(red("  ✗ INVALID"))
      console.log(yellow("  Error envelope:"))
      console.log(
        JSON.stringify(result.error, null, 2)
          .split("\n")
          .map(l => "    " + l)
          .join("\n"),
      )
    }

    console.log()
    console.log("  " + "─".repeat(50))

    
    console.log()
    console.log(dim("  Want to try a deliberately broken payload? (y/n)"))
    const tryBad = (await rl.question("  → ")).trim().toLowerCase()

    if (tryBad === "y") {
      console.log(dim("\n  Common things to break:"))
      console.log(dim("    • Remove a required field"))
      console.log(dim("    • Set limit: 999"))
      console.log(dim("    • Set score: 2.5"))
      console.log(dim("    • Set workspace: \"\""))
      console.log(dim("    • Add an unknown field"))
      console.log()
      const badLine = await rl.question("  Paste broken JSON: ")
      try {
        const badPayload = JSON.parse(badLine)
        
        const badResult = (selected.fn as (p: unknown) => any)(badPayload)
        console.log()
        if (!badResult.ok) {
          console.log(red("  ✗ Correctly rejected:"))
          console.log(
            JSON.stringify(badResult.error, null, 2)
              .split("\n")
              .map(l => "    " + l)
              .join("\n"),
          )
        } else {
          console.log(yellow("  ⚠ Payload was accepted (it might actually be valid)."))
        }
      } catch {
        console.log(red("  JSON parse error on bad payload."))
      }
    }

    await rl.question(dim("\n  Press Enter to test another tool..."))
  }
}

main().catch((err) => {
  console.error(red("\nPlayground crashed:"), err)
  process.exit(1)
})
