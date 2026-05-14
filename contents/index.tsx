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

  const captureAndSync = async () => {
    setSyncing(true)
    const structuredPayload = extractStructuredChat()
    
    // For raw unstructured storage, convert to readable text
    const plainTextPayload = structuredPayload
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n")
      
    const workspace = structuredPayload[0]?.workspace || "Personal"

    chrome.runtime.sendMessage({
      type: "STORE_RAW_CHAT",
      raw_content: plainTextPayload,
      workspace: workspace,
      source: workspace.toUpperCase()
    }, (response) => {
      if (response?.success) {
        injectUniversalContext()
        fetchRecentChats()
      } else {
        console.error("Sync Failed:", response?.error)
      }
      setSyncing(false)
    })
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
              onClick={captureAndSync}
              className="action-btn sync-btn"
              disabled={syncing || (!identity && !hasChat)}
            >
              <span className="icon">🚀</span>
              <span className="text">{syncing ? "Syncing..." : "Connect"}</span>
              {syncing && <div className="loader white"></div>}
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
    </div>
  )
}

export default MindBridgeUI
