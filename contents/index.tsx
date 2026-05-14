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
  // ChatGPT
  const chatgptInput = document.querySelector("#prompt-textarea")?.closest('.flex.flex-col')
  if (chatgptInput) return chatgptInput

  // Claude
  const claudeInput = document.querySelector("div[contenteditable='true']")?.closest('.flex.flex-col')
  if (claudeInput) return claudeInput

  // Gemini
  const geminiInput = document.querySelector("div[contenteditable='true']")?.closest('.input-area') || 
                     document.querySelector("div[contenteditable='true']")?.parentElement
  if (geminiInput) return geminiInput

  return null
}

const workspaces = ["Personal", "Work", "Startup", "Client A"]

const MindBridgeUI = () => {
  const [memories, setMemories] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState("Personal")
  
  // Mock Identity (in real life, fetch from storage/background)
  const identity = {
    role: "Senior Product Manager",
    goal: "Building B2B SaaS",
    style: "Concise, technical"
  }

  const fetchMemories = () => {
    setLoading(true)
    chrome.runtime.sendMessage({ type: "GET_MEMORIES", workspace: selectedWorkspace }, (response) => {
      if (response && response.memories) {
        setMemories(response.memories)
      }
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchMemories()
    
    // Feature: Auto-capture listener
    const handleCapture = (e: MouseEvent | KeyboardEvent) => {
      // Check if send button clicked or Enter pressed
      const target = e.target as HTMLElement
      const isSendButton = target.closest('button[data-testid*="send"]') || 
                           target.closest('button[aria-label*="Send"]')
      const isEnter = e instanceof KeyboardEvent && e.key === 'Enter' && !e.shiftKey

      if (isSendButton || isEnter) {
        const input = document.querySelector("#prompt-textarea") || 
                      document.querySelector("div[contenteditable='true']")
        const content = input instanceof HTMLTextAreaElement ? input.value : 
                        input instanceof HTMLElement ? input.innerText : ""
        
        if (content.length > 10) {
          console.log("MindBridge: Capturing conversation snippet for learning...", content)
          chrome.runtime.sendMessage({ type: "CAPTURE_SNIPPET", content, platform: window.location.hostname })
        }
      }
    }

    window.addEventListener('click', handleCapture)
    window.addEventListener('keydown', handleCapture)
    
    return () => {
      window.removeEventListener('click', handleCapture)
      window.removeEventListener('keydown', handleCapture)
    }
  }, [selectedWorkspace])

  const injectContext = () => {
    const contextStr = 
      `[MINDBRIDGE UNIVERSAL CONTEXT]\n` +
      `User Role: ${identity.role}\n` +
      `Current Goal: ${identity.goal}\n` +
      `Response Style: ${identity.style}\n` +
      `---\n` +
      `Relevant ${selectedWorkspace} Memories:\n` + 
      memories.map(m => `- ${m.summary}`).join("\n") + 
      "\n[END CONTEXT]\n\n"
    
    const input = document.querySelector("#prompt-textarea") || 
                  document.querySelector("div[contenteditable='true']")
    
    if (input) {
      if (input instanceof HTMLTextAreaElement) {
        const start = input.selectionStart
        input.value = contextStr + input.value
        input.selectionStart = input.selectionEnd = start + contextStr.length
      } else if (input instanceof HTMLElement && input.isContentEditable) {
        // Simple prepending for contenteditable
        input.innerText = contextStr + input.innerText
      }
      
      input.dispatchEvent(new Event('input', { bubbles: true }))
      setShowDropdown(false)
    }
  }

  if (memories.length === 0 && !loading) return null

  return (
    <div className="mind-bridge-inject-container" onClick={() => setShowDropdown(!showDropdown)}>
      <div className="mind-bridge-logo-small"></div>
      <span>Bridge Context: {selectedWorkspace}</span>
      <span className="mind-bridge-count">{memories.length}</span>

      {showDropdown && (
        <div className="mind-bridge-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="workspace-label">Neural Identity</div>
          <div style={{ fontSize: '12px', color: '#f3f4f6', marginBottom: '12px', padding: '8px', background: '#1c1c1f', borderRadius: '6px' }}>
            {identity.role} • {identity.style}
          </div>

          <div className="workspace-label">Switch Workspace</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {workspaces.map(w => (
              <div 
                key={w} 
                onClick={() => setSelectedWorkspace(w)}
                className={`workspace-chip ${selectedWorkspace === w ? 'active' : ''}`}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="workspace-label">Universal Memories</div>
          <div className="memory-scroll">
            {memories.map((m, i) => (
              <div key={i} className="memory-item">
                {m.summary}
              </div>
            ))}
          </div>
          
          <button 
            onClick={injectContext}
            className="inject-btn"
          >
            Inject Universal Context
          </button>
        </div>
      )}
    </div>
  )
}

export default MindBridgeUI
