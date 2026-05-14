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
  const [bridgeContext, setBridgeContext] = useState(null)
  const [identity, setIdentity] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasChat, setHasChat] = useState(false)

  useEffect(() => {
    const checkChat = () => {
      const messages = document.querySelectorAll('.message, [data-testid*="message"], .font-claude-message')
      setHasChat(messages.length > 0)
    }
    const observer = new MutationObserver(checkChat)
    observer.observe(document.body, { childList: true, subtree: true })
    checkChat()
    return () => observer.disconnect()
  }, [])

  const detectIdentity = async () => {
    if (!hasChat) return
    setLoading(true)
    const allMessages = Array.from(document.querySelectorAll('.message, [data-testid*="message"], .font-claude-message'))
      .map(m => (m as HTMLElement).innerText)
      .join("\n\n")
    
    chrome.runtime.sendMessage({ 
      type: "EXTRACT_IDENTITY", 
      history: allMessages 
    }, (response) => {
      setLoading(false)
      if (response?.identity) {
        setIdentity(response.identity)
        console.log("MindBridge: RAG Extraction Complete and stored in Postgres.")
      } else if (response?.error) {
        console.error("Extraction Failed:", response.error)
      }
    })
  }

  const injectUniversalContext = () => {
    if (!identity && !bridgeContext) return

    const input = document.querySelector("#prompt-textarea") || 
                  document.querySelector("div[contenteditable='true']")
    
    if (input) {
      const contextBlock = 
        `[MINDBRIDGE NEURAL IDENTITY SYNCED]\n` +
        (identity ? `Role: ${identity.role}\nGoal: ${identity.goal}\nTech: ${identity.tech_stack?.join(", ")}\n` : "") +
        (bridgeContext ? `Current Flow: ${bridgeContext}\n` : "") +
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
      if (response?.bridgePrompt) setBridgeContext(response.bridgePrompt)
    })
  }, [])

  return (
    <div className="mind-bridge-wrapper">
      <div 
        className={`mind-bridge-main-btn ${identity ? 'active' : ''}`} 
        onClick={() => setShowDropdown(!showDropdown)}
        id="mindbridge-identity-ai-btn"
      >
        <div className="neural-icon">
          <div className="pulse"></div>
        </div>
        <span>{identity ? "Identity Synced" : "Identity AI"}</span>
      </div>

      {showDropdown && (
        <div className="mind-bridge-panel" onClick={(e) => e.stopPropagation()}>
          <div className="panel-header">
            <span className="header-tag">NEURAL ENGINE</span>
            <h3>Identity Sync</h3>
          </div>
          
          <div className="panel-body">
            <button 
              onClick={detectIdentity}
              className="action-btn detect-btn"
              disabled={loading || !hasChat}
            >
              <span className="icon">🧬</span>
              <span className="text">{loading ? "Analyzing..." : "Detect Identity from Chat"}</span>
              {loading && <div className="loader"></div>}
            </button>

            <button 
              onClick={injectUniversalContext}
              className="action-btn sync-btn"
              disabled={!identity && !bridgeContext}
            >
              <span className="icon">🚀</span>
              <span className="text">Sync to this Chat</span>
            </button>

            {identity && (
              <div className="identity-card">
                <div className="card-label">DETECTED PERSONA</div>
                <div className="role-text">{identity.role}</div>
                <div className="goal-text">{identity.goal}</div>
                {identity.tech_stack && (
                  <div className="tech-pills">
                    {identity.tech_stack.slice(0, 3).map(tech => (
                      <span key={tech} className="pill">{tech}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="panel-footer">
            <div className="status-indicator">
              <div className="dot"></div>
              <span>Postgres & ChromaDB Connected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MindBridgeUI
