import { auth } from "~core/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { memoryEngine } from "./lib/memory-engine"
import { addMemory } from "~core/api"

console.log("MindBridge Neural Engine: Ready to Profile")

// State Management
let currentIdentity: any = null
let currentBridgePrompt = null

const INITIAL_CONNECTIONS = {
  chatgpt: false,
  claude: false,
  gemini: false,
  copilot: false
}

// Listen for Firebase Auth changes
if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("[Neural Engine] Firebase Auth Detected:", user.email)
      currentIdentity = { 
        ...currentIdentity, 
        email: user.email,
        uid: user.uid
      }
    } else {
      console.log("[Neural Engine] No Firebase User detected.")
      currentIdentity = null
    }
  })
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
  // 1. EXTRACT IDENTITY - Uses Sneha's RAG MemoryEngine logic
  if (request.type === "EXTRACT_IDENTITY") {
    // BLOCKER: Do nothing if not signed in to Google
    if (!currentIdentity?.email) {
      console.log("[Neural Engine] Extraction blocked: No Google Identity found.")
      return false
    }

    console.log("[Neural Engine] Analyzing chat history with RAG engine...")
    
    // Use the Memory Engine to convert unstructured chat to structured memory
    memoryEngine.extract(request.history).then(async (memory) => {
      const identityUpdate = {
        role: `Developer working on ${memory.project}`,
        goal: memory.goal,
        style: "Technical, concise",
        memory: memory // Store the full structured RAG memory
      }
      
      currentIdentity = { ...currentIdentity, ...identityUpdate }
      
      // Store the structured data in ChromaDB via FastAPI
      await addMemory(
        `Project: ${memory.project}. Goal: ${memory.goal}. Tech: ${memory.tech_stack.join(", ")}`, 
        "Personal", 
        "context", 
        ["rag", "identity", ...memory.tech_stack]
      )

      sendResponse({ identity: currentIdentity })
    })
    return true
  }

  // 2. GENERATE BRIDGE
  if (request.type === "GENERATE_BRIDGE") {
    const rawText = request.rawContent || ""
    currentBridgePrompt = `Continue the workflow for: "${rawText.substring(0, 100)}..."`
    
    // Store bridge in ChromaDB
    addMemory(
      currentBridgePrompt, 
      "Personal", 
      "context", 
      ["bridge", "temporary"]
    ).then(() => {
      sendResponse({ bridgePrompt: currentBridgePrompt })
    })
    return true
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

  // 4. PLATFORM_SYNC - Identity Verification Logic
  if (request.type === "PLATFORM_SYNC") {
    if (!currentIdentity?.email) {
      console.log("[Neural Engine] Sync blocked: No Google Identity found.")
      return false
    }

    const { platform, status, detectedEmail } = request.payload
    
    let connectionStatus = status
    if (detectedEmail && currentIdentity?.email) {
      if (detectedEmail.toLowerCase() === currentIdentity.email.toLowerCase()) {
        connectionStatus = true // Verified
      } else {
        connectionStatus = "mismatch" // Warning
      }
    }

    updateConnection(platform, connectionStatus).then(connections => {
      chrome.runtime.sendMessage({ type: "CONNECTIONS_UPDATED", connections })
    })
    return false
  }

  // 5. MANUAL_CONNECT
  if (request.type === "MANUAL_CONNECT") {
    const { url } = request.payload
    chrome.tabs.create({ url })
    return false
  }

  // 6. UPDATE_IDENTITY
  if (request.type === "UPDATE_IDENTITY") {
    currentIdentity = { ...currentIdentity, ...request.identity }
    return false
  }
})
