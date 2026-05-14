import { useState, useEffect } from "react"
import "./style.css"
import { auth } from "~core/firebase"
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth"

import { searchMemories, addMemory, type Memory } from "~core/api"

const platforms = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "🤖",
    color: "#10a37f",
    url: "https://chatgpt.com"
  },
  {
    id: "claude",
    name: "Claude.ai",
    icon: "🎭",
    color: "#d97757",
    url: "https://claude.ai"
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "✨",
    color: "#4285f4",
    url: "https://gemini.google.com"
  },
  {
    id: "copilot",
    name: "Github Copilot",
    icon: "🚀",
    color: "#ffffff",
    url: "https://github.com/copilot"
  }
]

function IndexPopup() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("identity")
  const [identity, setIdentity] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedWorkspace, setSelectedWorkspace] =
    useState("Personal")

  const [connections, setConnections] = useState({
    chatgpt: false,
    claude: false,
    gemini: false,
    copilot: false
  })

  useEffect(() => {
    let unsubscribe = () => { }

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser)

        if (firebaseUser) {
          setIdentity((prev) => ({
            ...prev,
            email: firebaseUser.email
          }))
        }
      })
    }

    chrome.runtime.sendMessage(
      { type: "CHECK_SYNC" },
      (response) => {
        if (response) {
          if (response.identity)
            setIdentity(response.identity)

          if (response.connections)
            setConnections(response.connections)
        }

        setLoading(false)
      }
    )

    const listener = (message) => {
      if (message.type === "CONNECTIONS_UPDATED") {
        setConnections(message.connections)
      }
    }

    chrome.runtime.onMessage.addListener(listener)

    return () => {
      chrome.runtime.onMessage.removeListener(listener)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (
      activeTab === "memories" ||
      activeTab === "workspaces"
    ) {
      searchMemories("", selectedWorkspace)
        .then((data) => {
          if (data?.memories) {
            setMemories(data.memories)
          }
        })
        .catch(() => {
          console.log(
            "Backend offline, showing local state only."
          )

          setMemories([])
        })
    }
  }, [activeTab, selectedWorkspace])

  const handleSignIn = async () => {
    if (!auth) {
      alert(
        "Firebase is not initialized. Check your env variables."
      )

      return
    }

    const provider = new GoogleAuthProvider()

    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Auth Error:", error)
    }
  }

  const handleSignOut = () => {
    auth && signOut(auth)
  }

  const handleConnect = async (id) => {
    const platform = platforms.find((p) => p.id === id)

    if (!platform) return

    setConnections((prev) => ({
      ...prev,
      [id]: "syncing"
    }))

    setActiveTab("memories")

    try {
      await addMemory(
        `Connected to ${platform.name}`,
        selectedWorkspace,
        "connection",
        ["mindbridge", "ai-sync"]
      )

      const data = await searchMemories(
        "",
        selectedWorkspace
      )

      if (data?.memories) {
        setMemories(data.memories)
      }
    } catch (e) {
      console.log("Memory backend unavailable.")
    }

    chrome.runtime.sendMessage({
      type: "MANUAL_CONNECT",
      payload: {
        url: platform.url,
        platform: platform.name
      }
    })

    setTimeout(() => {
      setConnections((prev) => ({
        ...prev,
        [id]: true
      }))
    }, 2000)
  }

  if (loading) {
    return (
      <div className="container loading-screen">
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="nav-header">
        <div className="logo-container">
          <div className="logo-icon">M</div>

          <span className="logo-text">
            MindBridge
          </span>
        </div>

        <div className="user-profile">
          <div className="avatar"></div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 500
            }}>
            {user?.displayName || "Noah M."}
          </span>
        </div>
      </header>

      <nav className="tab-bar">
        {["identity", "memories", "workspaces"].map(
          (tab) => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""
                }`}
              onClick={() => setActiveTab(tab)}>
              {tab === "identity"
                ? "Neural Sync"
                : tab.charAt(0).toUpperCase() +
                tab.slice(1)}
            </div>
          )
        )}
      </nav>

      <main className="main-content">
        {activeTab === "identity" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
            <section>
              <div className="section-title">
                Neural Persona
              </div>

              <div
                style={{
                  padding: "16px",
                  background:
                    "linear-gradient(135deg, var(--accent-soft), transparent)",
                  borderRadius: "16px",
                  border:
                    "1px solid var(--accent)",
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.2)"
                }}>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--accent)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    letterSpacing: "0.05em"
                  }}>
                  ACTIVE IDENTITY
                </div>

                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "white"
                  }}>
                  {identity?.role ||
                    "Neural Engineer"}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "6px"
                  }}>
                  {identity?.goal ||
                    "Building the future of AI connectivity"}
                </div>
              </div>
            </section>

            <section>
              <div className="section-title">
                Neural Connections
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                {platforms.map((p) => (
                  <div
                    key={p.id}
                    className="memory-card"
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      padding: "12px 14px"
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                      <span
                        style={{
                          fontSize: "18px"
                        }}>
                        {p.icon}
                      </span>

                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600
                        }}>
                        {p.name}
                      </span>
                    </div>

                    {connections[p.id] === true ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#22c55e",
                          fontSize: "11px",
                          fontWeight: 600
                        }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background:
                              "#22c55e",
                            boxShadow:
                              "0 0 12px #22c55e"
                          }}
                        />

                        Synced
                      </div>
                    ) : connections[p.id] ===
                      "syncing" ? (
                      <div className="loader"></div>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() =>
                          handleConnect(p.id)
                        }>
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "memories" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}>
            {/* CLEAN CONNECTED STATUS */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                padding: "14px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(15,23,42,0.65))",
                border:
                  "1px solid rgba(14,165,233,0.35)",
                backdropFilter: "blur(14px)",
                boxShadow:
                  "0 0 30px rgba(14,165,233,0.18)"
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow:
                      "0 0 12px #22c55e"
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column"
                  }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "white"
                    }}>
                    MindBridge Connected
                  </span>

                  <span
                    style={{
                      fontSize: "10px",
                      color:
                        "var(--text-muted)"
                    }}>
                    Neural identity synchronized
                  </span>
                </div>
              </div>

              <button
                className="btn-primary"
                style={{
                  padding: "7px 14px",
                  fontSize: "11px",
                  borderRadius: "10px"
                }}
                onClick={() => {
                  chrome.runtime.sendMessage({
                    type: "OPEN_SIDE_PANEL"
                  })
                }}>
                Open Bridge
              </button>
            </div>

            <div className="section-title">
              Active Neural Bridge
            </div>

            <div
              className="memory-card"
              style={{
                borderStyle: "dashed",
                borderColor: "#f59e0b"
              }}>
              <div
                className="memory-content"
                style={{
                  fontSize: "12px",
                  color: "#f3f4f6"
                }}>
                {identity?.bridgePrompt ||
                  "No active bridge context."}
              </div>
            </div>

            <div className="section-title">
              Neural Nodes (ChromaDB)
            </div>

            <div className="memory-stack">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="memory-card">
                  <div className="memory-header">
                    <span className="tag">
                      {m.type}
                    </span>

                    <span
                      style={{
                        fontSize: "10px",
                        color:
                          "var(--text-muted)"
                      }}>
                      {new Date(
                        m.timestamp
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="memory-content">
                    {m.summary || m.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "workspaces" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
            <section>
              <div className="section-title">
                Workspace Selection
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "8px"
                }}>
                {[
                  "Personal",
                  "Startup",
                  "Research"
                ].map((w) => (
                  <button
                    key={w}
                    onClick={() =>
                      setSelectedWorkspace(w)
                    }
                    className={
                      selectedWorkspace === w
                        ? "btn-primary"
                        : "btn-secondary"
                    }>
                    {w}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="status-footer">
        <div className="sync-status">
          <div className="dot"></div>

          <span>Systems Online</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            color: "var(--text-muted)"
          }}>
          <span style={{ cursor: "pointer" }}>
            Settings
          </span>
        </div>
      </footer>
    </div>
  )
}

export default IndexPopup