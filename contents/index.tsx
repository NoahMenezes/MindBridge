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
  const [showDropdown, setShowDropdown] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 1. "TAKE" - Scrape current conversation context
  const scrapeLastMessages = () => {
    // ChatGPT: .agent-turn, .user-turn
    // Claude: .font-claude-message, .font-user-message
    // This is a simplified selector for the hackathon
    const messages = Array.from(document.querySelectorAll('.message, [data-testid*="message"], .font-claude-message'))
      .slice(-4) // Get last 4 messages
      .map(m => m.innerText)
      .join("\n\n")
    
    return messages
  }

  const handleBridgeGeneration = async () => {
    setGenerating(true)
    const rawContent = scrapeLastMessages()
    
    if (rawContent) {
      console.log("MindBridge: Taking context from current chat...")
      // Send to background to "Generate" the bridge prompt
      chrome.runtime.sendMessage({ 
        type: "GENERATE_BRIDGE", 
        rawContent,
        platform: window.location.hostname 
      }, (response) => {
        if (response?.bridgePrompt) {
          setBridgeContext(response.bridgePrompt)
          console.log("MindBridge: Bridge prompt generated and stored.")
        }
        setGenerating(false)
      })
    }
  }

  useEffect(() => {
    // Check if there's a bridge context waiting from another tab
    chrome.runtime.sendMessage({ type: "CHECK_BRIDGE" }, (response) => {
      if (response?.bridgePrompt) {
        setBridgeContext(response.bridgePrompt)
      }
    })
  }, [])

  // 2. "PASS" - Inject into new AI chat
  const injectBridge = () => {
    if (!bridgeContext) return

    const input = document.querySelector("#prompt-textarea") || 
                  document.querySelector("div[contenteditable='true']")
    
    if (input) {
      const bridgeText = `[MindBridge Continuity Prompt]\n${bridgeContext}\n\nContinue the conversation based on this context:`
      
      if (input instanceof HTMLTextAreaElement) {
        input.value = bridgeText + input.value
      } else if (input instanceof HTMLElement && input.isContentEditable) {
        input.innerText = bridgeText + input.innerText
      }
      
      input.dispatchEvent(new Event('input', { bubbles: true }))
      setShowDropdown(false)
      // Clear after use? Optional.
    }
  }

  return (
    <div className="mind-bridge-inject-container" onClick={() => setShowDropdown(!showDropdown)}>
      <div className="mind-bridge-logo-small"></div>
      <span>{bridgeContext ? "⚡ Bridge Ready" : "MindBridge Active"}</span>

      {showDropdown && (
        <div className="mind-bridge-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="workspace-label">Current Bridge Flow</div>
          
          {!bridgeContext ? (
            <button 
              onClick={handleBridgeGeneration}
              className="inject-btn"
              style={{ background: '#1c1c1f', border: '1px solid #262626', color: '#f3f4f6' }}
              disabled={generating}
            >
              {generating ? "Generating Bridge..." : "📥 Take context from this chat"}
            </button>
          ) : (
            <>
              <div className="memory-item" style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                <strong>Generated Bridge:</strong><br/>
                {bridgeContext.substring(0, 100)}...
              </div>
              <button 
                onClick={injectBridge}
                className="inject-btn"
              >
                🚀 Pass context to this chat
              </button>
              <button 
                onClick={() => setBridgeContext(null)}
                className="btn-ghost"
                style={{ width: '100%', marginTop: '4px' }}
              >
                Clear Bridge
              </button>
            </>
          )}

          <div className="workspace-label" style={{ marginTop: '12px' }}>Standard Identity</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            Identity injection is also available in the popup.
          </div>
        </div>
      )}
    </div>
  )
}

export default MindBridgeUI
