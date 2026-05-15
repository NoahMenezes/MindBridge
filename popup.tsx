import { useState, useEffect } from "react"
import "./style.css"
import { auth } from "~core/firebase"
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { searchMemories, getSlackSyncUrl, type Memory } from "~core/api"

const platforms = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', color: '#10a37f', url: 'https://chatgpt.com' },
  { id: 'claude', name: 'Claude.ai', icon: '🎭', color: '#d97757', url: 'https://claude.ai' },
  { id: 'gemini', name: 'Google Gemini', icon: '✨', color: '#4285f4', url: 'https://gemini.google.com' },
  { id: 'copilot', name: 'Github Copilot', icon: '🚀', color: '#ffffff', url: 'https://github.com/copilot' },
  { id: 'slack', name: 'Slack', icon: '💬', color: '#4A154B', url: 'https://app.slack.com' }
]

function IndexPopup() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("identity")
  const [identity, setIdentity] = useState(null)
  const [user, setUser] = useState(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState("Personal")
  const [connections, setConnections] = useState({
    chatgpt: false,
    claude: false,
    gemini: false,
    copilot: false,
    slack: false
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000)
  }

  useEffect(() => {
    let unsubscribe = () => { }
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser)
        if (firebaseUser) {
          setIdentity(prev => ({ ...prev, email: firebaseUser.email }))
        }
      })
    }

    chrome.runtime.sendMessage({ type: "CHECK_SYNC" }, (response) => {
      if (response) {
        if (response.identity) setIdentity(response.identity)
        if (response.connections) setConnections(response.connections)
      }
      setLoading(false)
    })

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
    if (activeTab === 'memories' || activeTab === 'workspaces') {
      searchMemories("", selectedWorkspace)
        .then(data => {
          if (data?.memories) setMemories(data.memories)
        })
        .catch(err => {
          console.log("Backend offline, showing local state only.")
          setMemories([])
        })
    }
  }, [activeTab, selectedWorkspace])

  const handleSignIn = async () => {
    if (!auth) {
      alert("Firebase is not initialized. Please check your .env file and restart the dev server.")
      return
    }
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Auth Error:", error)
    }
  }

  const handleSignOut = () => auth && signOut(auth)

  const handleConnect = async (id) => {
    const platform = platforms.find(p => p.id === id)
    if (platform) {
      setConnections(prev => ({ ...prev, [id]: 'syncing' }))
      
      let targetUrl = platform.url
      if (id === 'slack') {
        const data = await getSlackSyncUrl()
        if (data?.url) {
          targetUrl = data.url
          triggerToast("Slack Sync Initiated!", "success")
        } else {
          triggerToast("Failed to fetch Slack URL", "error")
        }
      }

      chrome.runtime.sendMessage({ type: "MANUAL_CONNECT", payload: { url: targetUrl } })
    }
  }

  return (
    <div className="container">
      <header className="nav-header">
        <div className="logo-container">
          <div className="logo-icon">M</div>
          <span className="logo-text">MindBridge</span>
        </div>
        <div className="user-profile">
          <div className="avatar"></div>
          <span style={{ fontSize: '11px', fontWeight: 500 }}>{user?.displayName || ""}</span>
        </div>
      </header>

      <nav className="tab-bar">
        {['identity', 'memories', 'workspaces'].map(tab => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'identity' ? 'Neural Sync' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === 'identity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section>
              <div className="section-title">Neural Persona</div>
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, var(--accent-soft), transparent)', borderRadius: '16px', border: '1px solid var(--accent)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  ACTIVE IDENTITY
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>{identity?.role || "Neural Engineer"}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineBreak: 'anywhere' }}>{identity?.goal || "Building the future of AI connectivity"}</div>
                {identity?.tech_stack && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {identity.tech_stack.slice(0, 3).map(tech => (
                      <span key={tech} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '10px', color: 'var(--accent)' }}>{tech}</span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="section-title">Neural Connections</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {platforms.map(p => (
                  <div key={p.id} className="memory-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>{p.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</span>
                    </div>
                    {connections[p.id] === true ? (
                      <div className="sync-status" style={{ color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                        <div className="dot"></div>
                        <span>Synced</span>
                      </div>
                    ) : connections[p.id] === 'syncing' ? (
                      <div className="loader" style={{ width: '12px', height: '12px' }}></div>
                    ) : (
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleConnect(p.id)}>Sync</button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'memories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-title">Active Neural Bridge</div>
            <div className="memory-card" style={{ borderStyle: 'dashed', borderColor: '#f59e0b' }}>
              <div className="memory-content" style={{ fontSize: '12px', color: '#f3f4f6' }}>
                {identity?.bridgePrompt || "No active bridge context."}
              </div>
              <button className="btn-ghost" style={{ marginTop: '8px', color: '#f59e0b', fontWeight: 600 }}>⚡ Bridge Sync</button>
            </div>

            <div className="section-title">Neural Nodes (ChromaDB)</div>
            <div className="memory-stack">
              {memories.map((m) => (
                <div key={m.id} className="memory-card">
                  <div className="memory-header">
                    <span className="tag">{m.type}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(m.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="memory-content">{m.summary || m.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'workspaces' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section>
              <div className="section-title">Workspace Selection</div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {['Personal', 'Startup', 'Research'].map(w => (
                  <button
                    key={w}
                    onClick={() => setSelectedWorkspace(w)}
                    className={selectedWorkspace === w ? "btn-primary" : "btn-secondary"}
                    style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="section-title">Neural Mindmap</div>
              <div style={{
                height: '180px',
                background: 'var(--panel-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <div className="logo-icon" style={{ zIndex: 2, transform: 'scale(1.2)', boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }}>M</div>

                { }
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    width: '40px',
                    height: '40px',
                    background: 'var(--accent-soft)',
                    borderRadius: '50%',
                    border: '1px solid var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    left: `${50 + 35 * Math.cos(i * 60 * Math.PI / 180)}%`,
                    top: `${50 + 35 * Math.sin(i * 60 * Math.PI / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.8
                  }}>
                    {['🤖', '🎭', '✨', '🚀', '🧠', '📁'][i]}
                  </div>
                ))}

                { }
                <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <circle cx="50%" cy="50%" r="65" fill="none" stroke="var(--border)" strokeDasharray="4 4" />
                </svg>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                Visualizing active connections in the <strong>{selectedWorkspace}</strong> workspace.
              </p>
            </section>
          </div>
        )}
      </main>

      <footer className="status-footer">
        <div className="sync-status">
          <div className="dot"></div>
          <span>Systems Online</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => window.open('http://localhost:3000', '_blank')}>Docs</span>
          <span style={{ cursor: 'pointer' }}>Settings</span>
        </div>
      </footer>
      {toast.show && (
        <div className={`toast-notification ${toast.type}`} style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          padding: '12px',
          borderRadius: '12px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'center',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 1000,
          animation: 'toastIn 0.3s ease-out'
        }}>
          {toast.type === 'success' ? '✅ ' : '❌ '}{toast.message}
        </div>
      )}
    </div>
  )
}

export default IndexPopup
