import { useState, useEffect } from "react"
import "./style.css"

const platforms = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', color: '#10a37f', url: 'https://chatgpt.com' },
  { id: 'claude', name: 'Claude.ai', icon: '🎭', color: '#d97757', url: 'https://claude.ai' },
  { id: 'gemini', name: 'Google Gemini', icon: '✨', color: '#4285f4', url: 'https://gemini.google.com' },
  { id: 'copilot', name: 'Github Copilot', icon: '🚀', color: '#ffffff', url: 'https://github.com/copilot' }
]

function IndexPopup() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("identity")
  const [identity, setIdentity] = useState(null)
  const [connections, setConnections] = useState({
    chatgpt: false,
    claude: false,
    gemini: false,
    copilot: false
  })

  useEffect(() => {
    // Initial fetch of state
    chrome.runtime.sendMessage({ type: "CHECK_SYNC" }, (response) => {
      if (response) {
        if (response.identity) setIdentity(response.identity)
        if (response.connections) setConnections(response.connections)
      }
      setLoading(false)
    })

    // Listen for real-time updates from background
    const listener = (message) => {
      if (message.type === "CONNECTIONS_UPDATED") {
        setConnections(message.connections)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  const handleConnect = (id) => {
    const platform = platforms.find(p => p.id === id)
    if (platform) {
      // Set to syncing locally for immediate feedback
      setConnections(prev => ({ ...prev, [id]: 'syncing' }))
      
      // Tell background to open the platform to trigger a sync
      chrome.runtime.sendMessage({ 
        type: "MANUAL_CONNECT", 
        payload: { url: platform.url } 
      })
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
          <span style={{ fontSize: '11px', fontWeight: 500 }}>Noah M.</span>
        </div>
      </header>

      <nav className="tab-bar">
        <div 
          className={`tab ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          Neural Sync
        </div>
        <div 
          className={`tab ${activeTab === 'memories' ? 'active' : ''}`}
          onClick={() => setActiveTab('memories')}
        >
          Memories
        </div>
        <div 
          className={`tab ${activeTab === 'workspaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('workspaces')}
        >
          Workspaces
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'identity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <section>
              <div className="section-title">Verified Neural Identity</div>
              <div style={{ padding: '16px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Master Identity Email
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="email" 
                    placeholder="your@email.com"
                    value={identity?.email || ''}
                    onChange={(e) => {
                      const newIdentity = { ...identity, email: e.target.value }
                      setIdentity(newIdentity)
                      chrome.runtime.sendMessage({ type: "UPDATE_IDENTITY", identity: newIdentity })
                    }}
                    style={{ 
                      flex: 1, 
                      background: 'black', 
                      border: '1px solid var(--border)', 
                      borderRadius: '6px', 
                      color: 'white', 
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              {!identity?.role ? (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Connect a tool below to begin syncing your persona.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '16px', background: 'var(--accent-soft)', borderRadius: '12px', border: '1px solid var(--accent)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Active Persona
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{identity.role}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{identity.goal}</div>
                </div>
              )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '11px', fontWeight: 600 }}>
                        <div className="dot"></div>
                        <span>Synced</span>
                      </div>
                    ) : connections[p.id] === 'syncing' ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verifying Login...</span>
                    ) : (
                      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleConnect(p.id)}>
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Connect your AI accounts with the same email to enable seamless cross-platform neural teleportation.
            </p>
          </div>
        )}

        {activeTab === 'memories' && (
          <>
            <div className="section-title">Active Neural Bridge</div>
            <div className="memory-card" style={{ borderStyle: 'dashed', borderColor: '#f59e0b', marginBottom: '16px' }}>
              <div className="memory-content" style={{ fontSize: '12px', color: '#f3f4f6' }}>
                Context captured. Ready to pass to a new AI platform.
              </div>
              <button className="btn-ghost" style={{ marginTop: '8px', color: '#f59e0b', fontWeight: 600 }}>⚡ Bridge Ready</button>
            </div>

            <div className="section-title">Static Memory Nodes</div>
            <div className="memory-stack">
              {['Project: React Fintech Dashboard', 'Prefers concise responses'].map((m, i) => (
                <div key={i} className="memory-card">
                  <div className="memory-header"><span className="tag">Captured</span></div>
                  <div className="memory-content">{m}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'workspaces' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="section-title">Workspace Segmentation</div>
            {['Personal', 'Startup Team', 'External Client'].map(w => (
              <div key={w} className="memory-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{w}</span>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Switch</button>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="status-footer">
        <div className="sync-status">
          <div className="dot"></div>
          <span>Systems Online</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }}>Settings</span>
        </div>
      </footer>
    </div>
  )
}

export default IndexPopup
