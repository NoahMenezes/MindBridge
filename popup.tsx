import { useState, useEffect } from "react"
import "./style.css"

function IndexPopup() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("memories")
  const [identity, setIdentity] = useState({
    role: "Senior Product Manager",
    goal: "Building B2B SaaS",
    style: "Concise, technical"
  })

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_MEMORIES" }, (response) => {
      if (response && response.memories) {
        setMemories(response.memories)
      }
      setLoading(false)
    })
  }, [])

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
          Identity
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-title">Core Identity (Universal)</div>
            
            <div className="identity-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Professional Role</label>
                <input 
                  className="professional-input" 
                  value={identity.role} 
                  onChange={(e) => setIdentity({...identity, role: e.target.value})}
                  style={{ width: '100%', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '13px' }}
                />
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Primary Goal</label>
                <input 
                  className="professional-input" 
                  value={identity.goal} 
                  onChange={(e) => setIdentity({...identity, goal: e.target.value})}
                  style={{ width: '100%', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '13px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Response Preference</label>
                <select 
                  style={{ width: '100%', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '13px' }}
                  value={identity.style}
                  onChange={(e) => setIdentity({...identity, style: e.target.value})}
                >
                  <option>Concise, technical</option>
                  <option>Detailed, academic</option>
                  <option>Creative, brainstorming</option>
                  <option>Step-by-step tutorial</option>
                </select>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              These settings are automatically whispered to every AI agent you interact with to ensure continuity.
            </p>

            <button className="btn-primary">Update Neural Identity</button>
          </div>
        )}

        {activeTab === 'memories' && (
          <>
            <div className="section-title">
              <span>Active Neural Bridge</span>
              <span className="dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }}></span>
            </div>
            
            <div className="memory-card" style={{ borderStyle: 'dashed', borderColor: '#f59e0b', marginBottom: '16px' }}>
              <div className="memory-content" style={{ fontSize: '12px', color: '#f3f4f6' }}>
                Neural context captured. Ready to pass to a new AI platform.
              </div>
              <button className="btn-ghost" style={{ marginTop: '8px', color: '#f59e0b', fontWeight: 600 }}>⚡ Bridge Ready</button>
            </div>

            <div className="section-title">
              <span>Syncing Across Platforms</span>
              <button className="btn-ghost" style={{ fontSize: '10px' }}>Refresh</button>
            </div>

            <div className="memory-stack">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Initializing neural link...
                </div>
              ) : memories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No memories indexed yet.
                </div>
              ) : (
                memories.map((m, i) => (
                  <div key={i} className="memory-card">
                    <div className="memory-header">
                      <span className="tag" style={{ color: 'var(--accent)', borderColor: 'var(--accent-soft)' }}>Captured</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn-ghost" style={{ padding: '0 4px' }}>📌</button>
                        <button className="btn-ghost" style={{ padding: '0 4px' }}>🗑</button>
                      </div>
                    </div>
                    <div className="memory-content">{m.summary}</div>
                  </div>
                ))
              )}
            </div>

            <button className="btn-secondary" style={{ marginTop: 'auto' }}>
              View All in Web Dashboard
            </button>
          </>
        )}

        {activeTab === 'workspaces' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="section-title">Workspace Segmentation</div>
            {['Personal', 'Fintech Startup', 'Client A', 'Internal Research'].map(w => (
              <div key={w} className="memory-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{w}</span>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Switch</button>
              </div>
            ))}
            <button className="btn-secondary" style={{ borderStyle: 'dashed', background: 'none' }}>
              + Create New Workspace
            </button>
          </div>
        )}
      </main>

      <footer className="status-footer">
        <div className="sync-status">
          <div className="dot"></div>
          <span>Active Context: {identity.role}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }}>Settings</span>
        </div>
      </footer>
    </div>
  )
}

export default IndexPopup
