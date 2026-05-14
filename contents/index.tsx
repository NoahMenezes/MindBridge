import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useEffect, useState } from "react"
import cssText from "data-text:./style.css"

export interface StructuredMessage {
  role: "user" | "assistant";
  content: string;
  workspace: string;
  timestamp: number;
}

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/*", "https://claude.ai/*", "https://gemini.google.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  const chatgptInput = document.querySelector("#prompt-textarea")?.closest('.flex.flex-col')
  if (chatgptInput) return chatgptInput

  const claudeInput = document.querySelector("div[contenteditable='true']")?.closest('.flex.flex-col')
  if (claudeInput) return claudeInput

  const geminiInput = document.querySelector("div[contenteditable='true']")?.closest('.input-area') ||
    document.querySelector("div[contenteditable='true']")?.parentElement
  if (geminiInput) return geminiInput

  return null
}

const MindBridgeUI = () => {
  const [identity, setIdentity] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [hasChat, setHasChat] = useState(false)
  const [recentChats, setRecentChats] = useState([])
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [retrievedMemories, setRetrievedMemories] = useState([])
  const [fetchingMemories, setFetchingMemories] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const checkChat = () => {
      const messages = document.querySelectorAll(
        '.message, [data-testid*="message"], .font-claude-message, [class*="message-content"]'
      )
      setHasChat(messages.length > 0)
    }
    const observer = new MutationObserver(checkChat)
    observer.observe(document.body, { childList: true, subtree: true })
    checkChat()
    return () => observer.disconnect()
  }, [])

  const fetchRecentChats = () => {
    chrome.runtime.sendMessage({ type: "GET_RECENT_CHATS" }, (response) => {
      if (response?.chats) setRecentChats(response.chats)
    })
  }

  /**
   * extractStructuredChat
   * 
   * A robust DOM parsing pipeline that transforms raw page elements into 
   * clean, structured JSON objects. 
   * 
   * Features:
   * 1. Multi-platform selector support (ChatGPT/Claude)
   * 2. Content normalization (whitespace cleaning, UI artifact removal)
   * 3. Role mapping (user/assistant)
   * 4. Metadata injection (platform, synthetic timestamps)
   * 5. Deduplication (prevents redundant memory storage)
   */
  const extractStructuredChat = (): StructuredMessage[] => {
    const messages: StructuredMessage[] = []
    const now = Date.now()
    const workspace = window.location.hostname.includes("chatgpt") ? "chatgpt" :
      window.location.hostname.includes("claude") ? "claude" : "gemini"

    // --- PHASE 1: DOM EXTRACTION ---
    if (workspace === "chatgpt") {
      const chatgptNodes = document.querySelectorAll('div[data-message-author-role]')
      chatgptNodes.forEach((node, index) => {
        const roleAttr = node.getAttribute('data-message-author-role')
        let rawContent = (node as HTMLElement).innerText || ""

        // --- PHASE 2: DATA CLEANING ---
        // Remove zero-width spaces, normalize whitespace, and trim UI artifacts
        const cleanContent = rawContent
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .replace(/\s+/g, ' ')
          .trim()

        // --- PHASE 3: NORMALIZATION ---
        if (cleanContent.length > 0 && (roleAttr === 'user' || roleAttr === 'assistant')) {
          messages.push({
            role: roleAttr,
            content: cleanContent,
            workspace: workspace,
            timestamp: now - ((chatgptNodes.length - index) * 1000)
          })
        }
      })
    }
    else if (workspace === "claude") {
      const claudeNodes = document.querySelectorAll('.font-claude-message, .font-user-message, [class*="message-content"]')
      claudeNodes.forEach((node, index) => {
        const isUser = node.classList.contains('font-user-message') || !!node.closest('.chat-message-user')
        let rawContent = (node as HTMLElement).innerText || ""
        const cleanContent = rawContent
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .replace(/\s+/g, ' ')
          .trim()

        if (cleanContent.length > 0) {
          messages.push({
            role: isUser ? 'user' : 'assistant',
            content: cleanContent,
            workspace: workspace,
            timestamp: now - ((claudeNodes.length - index) * 1000)
          })
        }
      })
    }

    // --- PHASE 4: DEDUPLICATION ---
    // Prevent empty messages and duplicate entries from triggering multiple DB writes
    const uniqueMessages = []
    const seenContent = new Set()

    for (const msg of messages) {
      if (!seenContent.has(msg.content)) {
        seenContent.add(msg.content)
        uniqueMessages.push(msg)
      }
    }

    console.log("[MindBridge] Pipeline Output:", uniqueMessages)
    return uniqueMessages.slice(-20)
  }

  const detectIdentity = async () => {
    if (!hasChat) return
    setLoading(true)
    const structuredPayload = extractStructuredChat()

    console.log("[MindBridge] Sending payload to background script...")
    chrome.runtime.sendMessage({
      type: "DETECT_IDENTITY",
      messages: structuredPayload,
      workspace: structuredPayload[0]?.workspace || "Personal"
    }, (response) => {
      setLoading(false)
      console.log("[MindBridge] Backend Response:", response)
      if (response?.status === "success") {
        alert("Structured identity payload logged successfully on backend!")
      } else {
        console.error("Transmission Failed:", response?.error)
      }
    })
  }

  const openMemorySyncModal = () => {
    setShowSyncModal(true)
    setFetchingMemories(true)

    const structuredPayload = extractStructuredChat()
    const recentContext = structuredPayload
      .filter(m => m.role === "user")
      .slice(-5)
      .map(m => m.content)
      .join("\n")

    const platform = window.location.hostname.includes("chatgpt") ? "chatgpt" :
      window.location.hostname.includes("claude") ? "claude" : "gemini"
    
    const workspace = structuredPayload[0]?.workspace || platform

    chrome.runtime.sendMessage({
      type: "GET_RELEVANT_MEMORIES",
      query: recentContext,
      workspace: workspace
    }, (response) => {
      if (response?.memories) {
        setRetrievedMemories(response.memories)
      } else {
        setRetrievedMemories([])
      }
      setFetchingMemories(false)
    })
  }

  const injectMemoryContext = (memorySummary: string) => {
    const input = document.querySelector("#prompt-textarea") ||
      document.querySelector("div[contenteditable='true']")

    if (input) {
      const contextBlock = `[MEMORY CONTEXT]\n${memorySummary}\n[/MEMORY CONTEXT]\n\n`

      if (input instanceof HTMLTextAreaElement) {
        input.value = contextBlock + input.value
      } else if (input instanceof HTMLElement && input.isContentEditable) {
        input.innerText = contextBlock + input.innerText
      }

      input.dispatchEvent(new Event('input', { bubbles: true }))
      setShowSyncModal(false)
      setShowDropdown(false)

      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const injectUniversalContext = () => {
    const input = document.querySelector("#prompt-textarea") ||
      document.querySelector("div[contenteditable='true']")

    if (input) {
      const contextBlock =
        `[MINDBRIDGE NEURAL IDENTITY SYNCED]\n` +
        (identity ? `Role: ${identity.role}\nGoal: ${identity.goal}\n` : "") +
        `---\n\n`

      if (input instanceof HTMLTextAreaElement) {
        input.value = contextBlock + input.value
      } else if (input instanceof HTMLElement && input.isContentEditable) {
        input.innerText = contextBlock + input.innerText
      }

      input.dispatchEvent(new Event('input', { bubbles: true }))
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "CHECK_SYNC" }, (response) => {
      if (response?.identity) setIdentity(response.identity)
    })
    fetchRecentChats()
  }, [])

  return (
    <div className="mind-bridge-wrapper">
      <div
        className={`mind-bridge-main-btn ${identity ? 'active' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        id="mindbridge-identity-ai-btn"
      >
        <div className="neural-icon">
          <span className="brand-m">M</span>
          <div className="pulse"></div>
        </div>
        <span>{identity ? "Identity Synced" : "MindBridge Active"}</span>
      </div>

      {showDropdown && (
        <div className="mind-bridge-panel" onClick={(e) => e.stopPropagation()}>
          <div className="panel-header">
            <span className="header-tag">AI NEURAL SYNC</span>
          </div>

          <div className="panel-body">
            <button
              onClick={detectIdentity}
              className="action-btn detect-btn"
              disabled={loading || !hasChat}
            >
              <span className="icon">🧬</span>
              <span className="text">{loading ? "Analyzing..." : "Detect"}</span>
              {loading && <div className="loader"></div>}
            </button>

            <button
              onClick={openMemorySyncModal}
              className="action-btn sync-btn"
            >
              <span className="icon">🚀</span>
              <span className="text">Sync Memory</span>
            </button>
          </div>
        </div>
      )}

      {showSidebar && (
        <div className="mind-bridge-sidebar">
          <div className="sidebar-header">
            <h3>Neural Summary</h3>
            <button className="close-btn" onClick={() => setShowSidebar(false)}>✕</button>
          </div>

          <div className="sidebar-content">
            {identity && (
              <div className="summary-card highlight">
                <div className="card-label">CURRENT PERSONA</div>
                <div className="role-title">{identity.role}</div>
                <div className="goal-text">{identity.goal}</div>
              </div>
            )}

            <div className="history-section">
              <div className="section-label">RECENT ARCHIVES</div>
              {recentChats.map(chat => (
                <div key={chat.id} className="history-item">
                  <div className="item-meta">
                    <span className="source-tag">{chat.source}</span>
                    <span className="time-tag">{new Date(chat.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="item-snippet">{chat.snippet}</div>
                </div>
              ))}
              {recentChats.length === 0 && <div className="empty-state">No previous chats archived.</div>}
            </div>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div className="mind-bridge-sidebar" style={{ zIndex: 9999 }}>
          <div className="sidebar-header">
            <h3>Memory Sync</h3>
            <button className="close-btn" onClick={() => setShowSyncModal(false)}>✕</button>
          </div>
          <div className="sidebar-content">
            {fetchingMemories ? (
              <div className="loader" style={{ margin: "20px auto" }}></div>
            ) : (
              <div className="history-section">
                {retrievedMemories.map(mem => (
                  <div key={mem.id} className="history-item" style={{ marginBottom: "15px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
                    <div className="item-meta">
                      <span className="source-tag">{mem.type}</span>
                      <span className="time-tag">{new Date(mem.timestamp).toLocaleDateString()}</span>
                      <span className="source-tag" style={{ marginLeft: "5px" }}>{mem.workspace}</span>
                    </div>
                    <div className="item-snippet" style={{ margin: "8px 0" }}>{mem.summary}</div>
                    <button
                      onClick={() => injectMemoryContext(mem.summary)}
                      style={{ background: "#4caf50", color: "white", padding: "6px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                    >
                      Sync
                    </button>
                  </div>
                ))}
                {retrievedMemories.length === 0 && <div className="empty-state">No relevant memories found.</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {showToast && (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "#4caf50", color: "white", padding: "10px 20px", borderRadius: "8px", zIndex: 10000, fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
          Memory synced successfully
        </div>
      )}
    </div>
  )
}

export default MindBridgeUI
