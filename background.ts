export {}

console.log("MindBridge Universal Memory Engine Active")

// Mock database
let mockMemories = [
  { summary: "Building a fintech dashboard with React", workspace: "Startup", score: 0.95 },
  { summary: "Prefers concise, bulleted responses", workspace: "Personal", score: 0.88 },
  { summary: "Using Supabase for backend auth", workspace: "Startup", score: 0.82 }
]

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_MEMORIES") {
    const workspace = request.workspace || "Personal"
    const filtered = mockMemories.filter(m => m.workspace === workspace || workspace === "All")
    
    setTimeout(() => {
      sendResponse({ memories: filtered })
    }, 200)
    return true
  }

  if (request.type === "CAPTURE_SNIPPET") {
    console.log(`[Neural Capture] New snippet from ${request.platform}:`, request.content)
    // In production, this would be sent to /api/extract
    // For now, we'll simulate a "learned" memory appearing after 5 seconds
    setTimeout(() => {
      console.log("[Neural Engine] Successfully extracted new memory node.")
    }, 5000)
  }
})
