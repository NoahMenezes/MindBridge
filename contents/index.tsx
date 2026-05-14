import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useEffect, useState } from "react"
import cssText from "data-text:./style.css"

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

  const getChatHistory = () => {
    const messageNodes = Array.from(document.querySelectorAll('.message, [data-testid*="message"], .font-claude-message, [class*="message-content"]'))
    const recentNodes = messageNodes.slice(-15) 
    
    return recentNodes
      .map(m => (m as HTMLElement).innerText)
      .filter(text => text.trim().length > 10)
      .join("\n\n")
  }

  const detectIdentity = async () => {
    if (!hasChat) return
    setLoading(true)
    const history = getChatHistory()
    
    chrome.runtime.sendMessage({ 
      type: "EXTRACT_IDENTITY", 
      history: history 
    }, (response) => {
      setLoading(false)
      if (response?.identity) {
        setIdentity(response.identity)
        setShowSidebar(true) 
        fetchRecentChats()
      } else if (response?.error) {
        console.error("Extraction Failed:", response.error)
      }
    })
  }

  const captureAndSync = async () => {
    setSyncing(true)
    const history = getChatHistory()
    const workspace = "Personal"
    const source = window.location.hostname.includes("chatgpt") ? "ChatGPT" : 
                  window.location.hostname.includes("claude") ? "Claude" : "Gemini"

    chrome.runtime.sendMessage({
      type: "STORE_RAW_CHAT",
      raw_content: history,
      workspace: workspace,
      source: source
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
              <span className="text">{loading ? "Analyzing..." : "Detect My Identity from this Chat"}</span>
              {loading && <div className="loader"></div>}
            </button>

            <button 
              onClick={captureAndSync}
              className="action-btn sync-btn"
              disabled={syncing || (!identity && !hasChat)}
            >
              <span className="icon">🚀</span>
              <span className="text">{syncing ? "Syncing..." : "Sync Identity to this Chat"}</span>
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
