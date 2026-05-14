import { auth } from "~core/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { addMemory, extractIdentity, storeRawChat, getRecentChats, detectIdentityApi, getRelevantMemories } from "~core/api"

console.log("MindBridge Neural Engine: Ready to Profile")


let currentIdentity: any = null
let currentBridgePrompt = null

const INITIAL_CONNECTIONS = {
  chatgpt: false,
  claude: false,
  gemini: false,
  copilot: false
}


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
  
  if (request.type === "EXTRACT_IDENTITY") {
    extractIdentity(request.history, "Personal").then((response) => {
      if (response?.identity) {
        currentIdentity = { ...currentIdentity, ...response.identity }
        sendResponse({ identity: currentIdentity })
      } else {
        sendResponse({ error: "Backend analysis failed" })
      }
    }).catch(err => {
      console.error("RAG Engine Error:", err)
      sendResponse({ error: "Backend unreachable" })
    })
    return true
  }

  if (request.type === "DETECT_IDENTITY") {
    detectIdentityApi(request.messages, request.workspace || "Personal").then((response) => {
      sendResponse(response)
    }).catch(err => {
      console.error("Detect Identity API Error:", err)
      sendResponse({ status: "error", error: "Backend unreachable" })
    })
    return true
  }

  
  if (request.type === "STORE_RAW_CHAT") {
    storeRawChat(request.raw_content, request.workspace, request.source).then((response) => {
      if (response?.status === "success") {
        sendResponse({ success: true })
      } else {
        sendResponse({ error: response?.message || "Store failed" })
      }
    }).catch(err => {
      console.error("Store Error:", err)
      sendResponse({ error: "Backend unreachable" })
    })
    return true
  }

  
  if (request.type === "GET_RECENT_CHATS") {
    getRecentChats("Personal").then((response) => {
      sendResponse({ chats: response?.chats || [] })
    }).catch(err => {
      console.error("Fetch Error:", err)
      sendResponse({ chats: [] })
    })
    return true
  }

  if (request.type === "GET_RELEVANT_MEMORIES") {
    getRelevantMemories(request.query, request.workspace || "Personal").then((response) => {
      sendResponse(response)
    }).catch(err => {
      console.error("Memory Fetch Error:", err)
      sendResponse({ status: "error", memories: [] })
    })
    return true
  }

  
  if (request.type === "GENERATE_BRIDGE") {
    const rawText = request.rawContent || ""
    currentBridgePrompt = `Continue the workflow for: "${rawText.substring(0, 100)}..."`
    
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

  
  if (request.type === "PLATFORM_SYNC") {
    const { platform, status, detectedEmail } = request.payload
    
    let connectionStatus = status
    if (detectedEmail && currentIdentity?.email) {
      if (detectedEmail.toLowerCase() === currentIdentity.email.toLowerCase()) {
        connectionStatus = true 
      } else {
        connectionStatus = "mismatch" 
      }
    }

    updateConnection(platform, connectionStatus).then(connections => {
      chrome.runtime.sendMessage({ type: "CONNECTIONS_UPDATED", connections })
    })
    return false
  }

  
  if (request.type === "MANUAL_CONNECT") {
    const { url } = request.payload
    chrome.tabs.create({ url })
    return false
  }

  
  if (request.type === "UPDATE_IDENTITY") {
    currentIdentity = { ...currentIdentity, ...request.identity }
    return false
  }
})
