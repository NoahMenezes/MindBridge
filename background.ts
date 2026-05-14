import { memoryEngine } from "./lib/memory-engine"

export {}

console.log("MindBridge Neural Engine: Ready to Profile")

// State Management
let currentIdentity = null
let currentBridgePrompt = null

const INITIAL_CONNECTIONS = {
  chatgpt: false,
  claude: false,
  gemini: false,
  copilot: false
}

const getConnections = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get("connections", (result) => {
      resolve(result.connections || INITIAL_CONNECTIONS)
    })
  })
}

const updateConnection = (id, status) => {
  return new Promise((resolve) => {
    getConnections().then((connections: any) => {
      connections[id] = status
      chrome.storage.local.set({ connections }, () => {
        resolve(connections)
      })
    })
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. EXTRACT IDENTITY - Uses the real MemoryEngine logic
  if (request.type === "EXTRACT_IDENTITY") {
    console.log("[Neural Engine] Running Memory Extraction...")
    
    memoryEngine.extract(request.history).then(memory => {
      // Convert the memory into a "Persona" identity
      currentIdentity = {
        role: `Developer working on ${memory.project}`,
        goal: memory.goal,
        style: "Technical, concise",
        memory: memory // Store the full structured memory
      }
      sendResponse({ identity: currentIdentity })
    })
    return true
  }

  // 2. GENERATE BRIDGE
  if (request.type === "GENERATE_BRIDGE") {
    currentBridgePrompt = `Continue the workflow for: "${request.rawContent.substring(0, 50)}..."`
    sendResponse({ bridgePrompt: currentBridgePrompt })
    return false
  }

  // 3. CHECK SYNC
  if (request.type === "CHECK_SYNC") {
    getConnections().then(connections => {
      sendResponse({ 
        identity: currentIdentity, 
        bridgePrompt: currentBridgePrompt,
        connections: connections
      })
    })
    return true
  }

  // 4. PLATFORM_SYNC
  if (request.type === "PLATFORM_SYNC") {
    const { platform, status } = request.payload
    updateConnection(platform, status).then(connections => {
      chrome.runtime.sendMessage({ type: "CONNECTIONS_UPDATED", connections })
    })
    return false
  }

  // 5. UPDATE_IDENTITY
  if (request.type === "UPDATE_IDENTITY") {
    currentIdentity = { ...currentIdentity, ...request.identity }
    return false
  }
})
