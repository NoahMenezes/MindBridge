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

  // 1. "DETECT" - The Magic Feature: Scrape the whole chat to find the user's "Identity"
  const detectIdentity = async () => {
    setLoading(true)
    const allMessages = Array.from(document.querySelectorAll('.message, [data-testid*="message"], .font-claude-message'))
      .map(m => m.innerText)
      .join("\n\n")
    
    chrome.runtime.sendMessage({ 
      type: "EXTRACT_IDENTITY", 
      history: allMessages 
    }, (response) => {
      if (response?.identity) {
        setIdentity(response.identity)
        console.log("MindBridge: Neural Identity Detected!", response.identity)
      }
      setLoading(false)
    })
  }

  // 2. "BRIDGE" - Carry over the specific current thought
  const injectUniversalContext = () => {
    if (!identity && !bridgeContext) return

    const input = document.querySelector("#prompt-textarea") || 
                  document.querySelector("div[contenteditable='true']")
    
    if (input) {
      const contextBlock = 
        `[MINDBRIDGE NEURAL IDENTITY SYNCED]\n` +
        (identity ? `Role: ${identity.role}\nGoal: ${identity.goal}\n` : "") +
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

  // Helper to find email-like strings in the DOM
  const findEmailInDOM = () => {
    // 1. Try common selectors
    const potentialElements = document.querySelectorAll('.text-token-text-tertiary, .font-claude-message, [aria-label*="Profile"], .gb_d');
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // 2. Search entire visible text if selectors fail
    const pageText = document.body.innerText;
    const matches = pageText.match(emailRegex);
    
    return matches ? matches[0] : null;
  }

  useEffect(() => {
    // Determine which platform we are on
    const hostname = window.location.hostname
    let platform = null
    if (hostname.includes('chatgpt.com')) platform = 'chatgpt'
    else if (hostname.includes('claude.ai')) platform = 'claude'
    else if (hostname.includes('gemini.google.com')) platform = 'gemini'

    if (platform) {
      // Try to find the email on the page
      const detectedEmail = findEmailInDOM();
      
      // Automatically report that this platform is active/synced
      chrome.runtime.sendMessage({ 
        type: "PLATFORM_SYNC", 
        payload: { platform, status: true, detectedEmail } 
      })
    }

    // Check for existing identity/bridge context
    chrome.runtime.sendMessage({ type: "CHECK_SYNC" }, (response) => {
      if (response?.identity) setIdentity(response.identity)
      if (response?.bridgePrompt) setBridgeContext(response.bridgePrompt)
    })
  }, [])

  return (
    <div className="mind-bridge-inject-container" onClick={() => setShowDropdown(!showDropdown)}>
      <div className="mind-bridge-logo-small"></div>
      <span>{identity ? "🧬 Identity Synced" : "MindBridge Active"}</span>

      {showDropdown && (
        <div className="mind-bridge-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="workspace-label">AI Neural Sync</div>
          
          <button 
            onClick={detectIdentity}
            className="inject-btn"
            style={{ background: '#1c1c1f', border: '1px solid #262626', color: '#f3f4f6', marginBottom: '8px' }}
            disabled={loading}
          >
            {loading ? "Detecting Identity..." : "🧬 Detect My Identity from this Chat"}
          </button>

          {bridgeContext && (
            <div className="memory-item" style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
              <strong>Active Thought Bridge:</strong> Ready to teleport.
            </div>
          )}

          <button 
            onClick={injectUniversalContext}
            className="inject-btn"
            disabled={!identity && !bridgeContext}
          >
            🚀 Sync Identity to this Chat
          </button>

          {identity && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: 700, textTransform: 'uppercase' }}>Detected Identity</div>
              <div style={{ fontSize: '12px', color: 'white', marginTop: '4px' }}>{identity.role}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MindBridgeUI
