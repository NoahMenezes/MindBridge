
import type {
  PlasmoCSConfig,
  PlasmoGetOverlayAnchor
} from "plasmo"

import { useEffect, useState } from "react"

import cssText from "data-text:./style.css"

export interface StructuredMessage {
  role: "user" | "assistant"
  content: string
  workspace: string
  timestamp: number
}

export const config: PlasmoCSConfig = {
  matches: [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ]
}

/**
 * Inject isolated styles
 */
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

/**
 * FLOATING OVERLAY ROOT
 * NOT attached to prompt area anymore
 */
export const getOverlayAnchor: PlasmoGetOverlayAnchor =
  async () => {
    const existing =
      document.getElementById(
        "mindbridge-overlay-anchor"
      )

    if (existing) {
      return existing
    }

    const anchor = document.createElement("div")

    anchor.id = "mindbridge-overlay-anchor"

    document.body.appendChild(anchor)

    return anchor
  }

const MindBridgeUI = () => {
  const [identity, setIdentity] = useState<any>(null)

  const [showDropdown, setShowDropdown] =
    useState(false)

  const [loading, setLoading] = useState(false)

  const [syncing, setSyncing] = useState(false)

  const [hasChat, setHasChat] = useState(false)

  const [recentChats, setRecentChats] =
    useState([])

  const [showSidebar, setShowSidebar] =
    useState(false)

  const [showNeuralOverlay, setShowNeuralOverlay] =
    useState(false)

  /**
   * Detect messages
   */
  useEffect(() => {
    const checkChat = () => {
      const messages =
        document.querySelectorAll(
          '.message, [data-testid*="message"], .font-claude-message, [class*="message-content"]'
        )

      setHasChat(messages.length > 0)
    }

    const observer = new MutationObserver(
      checkChat
    )

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    checkChat()

    return () => observer.disconnect()
  }, [])

  /**
   * Load identity
   */
  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "CHECK_SYNC" },
      (response) => {
        if (response?.identity) {
          setIdentity(response.identity)
        }
      }
    )

    const listener = (message) => {
      if (
        message.type ===
        "SHOW_CUSTOM_SIDEBAR"
      ) {
        setShowSidebar(true)
      }
    }

    chrome.runtime.onMessage.addListener(
      listener
    )

    return () => {
      chrome.runtime.onMessage.removeListener(
        listener
      )
    }
  }, [])

  const fetchRecentChats = () => {
    chrome.runtime.sendMessage(
      { type: "GET_RECENT_CHATS" },
      (response) => {
        if (response?.chats) {
          setRecentChats(response.chats)
        }
      }
    )
  }

  /**
   * Extract chat messages
   */
  const extractStructuredChat =
    (): StructuredMessage[] => {
      const messages: StructuredMessage[] = []

      const now = Date.now()

      const workspace =
        window.location.hostname.includes(
          "chatgpt"
        )
          ? "chatgpt"
          : window.location.hostname.includes(
                "claude"
              )
            ? "claude"
            : "gemini"

      const nodes =
        document.querySelectorAll(
          "div[data-message-author-role]"
        )

      nodes.forEach((node, index) => {
        const role =
          node.getAttribute(
            "data-message-author-role"
          ) as "user" | "assistant"

        const content =
          (node as HTMLElement).innerText
            ?.replace(
              /[\u200B-\u200D\uFEFF]/g,
              ""
            )
            .replace(/\s+/g, " ")
            .trim()

        if (content) {
          messages.push({
            role,
            content,
            workspace,
            timestamp:
              now -
              ((nodes.length - index) * 1000)
          })
        }
      })

      return messages.slice(-20)
    }

  /**
   * Detect identity
   */
  const detectIdentity = async () => {
    if (!hasChat) return

    setLoading(true)

    const payload =
      extractStructuredChat()

    chrome.runtime.sendMessage(
      {
        type: "DETECT_IDENTITY",
        messages: payload,
        workspace:
          payload[0]?.workspace ||
          "Personal"
      },
      (response) => {
        setLoading(false)

        console.log(response)
      }
    )
  }

  /**
   * Sync memories
   */
  const captureAndSync = async () => {
    // Open the local dashboard immediately
    chrome.runtime.sendMessage({
      type: "MANUAL_CONNECT",
      payload: { url: "http://localhost:3000" }
    })

    setSyncing(true)

    const payload =
      extractStructuredChat()

    const plainText = payload
      .map(
        (m) =>
          `${m.role.toUpperCase()}: ${m.content}`
      )
      .join("\n\n")

    chrome.runtime.sendMessage(
      {
        type: "STORE_RAW_CHAT",
        raw_content: plainText,
        workspace:
          payload[0]?.workspace ||
          "Personal",
        source:
          payload[0]?.workspace?.toUpperCase() ||
          "CHATGPT"
      },
      (response) => {
        setSyncing(false)

        if (response?.success) {
          setShowNeuralOverlay(true)

          fetchRecentChats()

          chrome.runtime.sendMessage({
            type: "OPEN_SIDE_PANEL"
          })
        }
      }
    )
  }

  return (
    <>
      {/* FLOATING BUTTON */}

      <div
        className="mindbridge-floating-root"
        style={{
          position: "fixed",
          bottom: "110px",
          left: "24px",
          zIndex: 999999999,
          pointerEvents: "auto"
        }}>
        <div
          className={`mind-bridge-main-btn ${
            identity ? "active" : ""
          }`}
          onClick={() =>
            setShowDropdown(!showDropdown)
          }>
          <div className="neural-icon">
            <span className="brand-m">
              M
            </span>

            <div className="pulse"></div>
          </div>

          <span>
            {identity
              ? "MindBridge Connected"
              : "MindBridge Active"}
          </span>
        </div>

        {/* DROPDOWN */}

        {showDropdown && (
          <div className="mind-bridge-panel">
            <div className="panel-header">
              <span className="header-tag">
                AI NEURAL SYNC
              </span>
            </div>

            <div className="panel-body">
              <button
                onClick={detectIdentity}
                className="action-btn detect-btn"
                disabled={
                  loading || !hasChat
                }>
                🧬{" "}
                {loading
                  ? "Analyzing..."
                  : "Detect"}
              </button>

              <button
                onClick={captureAndSync}
                className="action-btn sync-btn"
                disabled={
                  syncing || !hasChat
                }>
                🚀{" "}
                {syncing
                  ? "Syncing..."
                  : "Connect"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEURAL OVERLAY */}

      {showNeuralOverlay && (
        <div className="neural-identity-overlay">
          <div className="overlay-content">
            <div className="overlay-header">
              <div className="status-indicator">
                <div className="dot pulse"></div>

                <span>
                  NEURAL BRIDGE ACTIVE
                </span>
              </div>

              <button
                className="close-overlay"
                onClick={() =>
                  setShowNeuralOverlay(false)
                }>
                ×
              </button>
            </div>

            <div className="identity-sync-info">
              <div className="sync-icon">
                🧬
              </div>

              <div className="sync-details">
                <div className="role-text">
                  {identity?.role ||
                    "Neural Engineer"}
                </div>

                <div className="sync-status">
                  Identity Verified &
                  Synced
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}

      {showSidebar && (
        <div className="mind-bridge-sidebar">
          <div className="sidebar-header">
            <h3>Neural History</h3>

            <button
              className="close-btn"
              onClick={() =>
                setShowSidebar(false)
              }>
              ×
            </button>
          </div>

          <div className="sidebar-content">
            {recentChats.map(
              (chat: any, idx) => (
                <div
                  key={idx}
                  className="history-item">
                  <div className="item-snippet">
                    {chat.content}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default MindBridgeUI

