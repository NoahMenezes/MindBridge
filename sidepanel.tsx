import { useState, useEffect } from "react"
import "./style.css"
import { auth } from "~core/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { searchMemories, type Memory } from "~core/api"

interface IdentityData {
  role?: string
  goal?: string
  email?: string
  tech_stack?: string[]
  bridgePrompt?: string
}

interface NeuralMetrics {
  totalMemories: number
  connectedPlatforms: number
  syncStatus: 'active' | 'syncing' | 'idle'
  lastSync?: string
}

function SidePanel() {
  const [identity, setIdentity] = useState<IdentityData | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [metrics, setMetrics] = useState<NeuralMetrics>({
    totalMemories: 0,
    connectedPlatforms: 0,
    syncStatus: 'active',
    lastSync: new Date().toLocaleTimeString()
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Track authentication
    if (auth) {
      onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser)
      })
    }

    // Get identity from background
    chrome.runtime.sendMessage({ type: "CHECK_SYNC" }, (response) => {
      if (response?.identity) {
        setIdentity(response.identity)
      }
    })

    // Get memories from backend
    searchMemories("", "Personal")
      .then(data => {
        if (data?.memories) {
          setMemories(data.memories)
          setMetrics(prev => ({
            ...prev,
            totalMemories: data.memories.length
          }))
        }
      })
      .catch(() => {
        setMemories([])
      })

    // Listen for sync updates
    const listener = (message: any) => {
      if (message.type === "CONNECTIONS_UPDATED") {
        setMetrics(prev => ({
          ...prev,
          connectedPlatforms: Object.values(message.connections).filter((v: any) => v === true).length,
          lastSync: new Date().toLocaleTimeString()
        }))
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  // Generate stats dynamically
  const generateStatCard = (label: string, value: string | number, icon: string, color: string) => (
    <div style={{
      flex: 1,
      padding: '16px',
      background: 'var(--panel-bg)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{ fontSize: '20px' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )

  return (
    <div className="sidepanel-container">
      <div className="sidepanel-content">
        {/* Main Neural Sync Banner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(16, 185, 129, 0.1))',
          borderRadius: '16px',
          border: '2px solid var(--accent)',
          marginBottom: '32px',
          boxShadow: '0 0 40px rgba(14, 165, 233, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }}></div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }}></div>

          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
            marginBottom: '20px',
            animation: 'pulse 2s ease-in-out infinite',
            position: 'relative',
            zIndex: 2
          }}></div>

          <div style={{
            fontSize: '18px',
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: '#10b981',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '16px',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
            position: 'relative',
            zIndex: 2,
            lineHeight: 1.3
          }}>
            [MINDBRIDGE<br/>NEURAL IDENTITY<br/>SYNCED]---
          </div>

          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            {metrics.syncStatus === 'syncing' ? 'Synchronizing neural networks...' : 'Neural identity established and verified'}
          </div>
        </div>

        {/* Identity Card */}
        {identity && (
          <div style={{ marginBottom: '32px' }}>
            <div className="section-title" style={{ marginBottom: '16px' }}>Active Neural Persona</div>
            <div className="memory-card" style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                {identity.role || 'Neural Engineer'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                {identity.goal || 'Optimizing cross-platform AI integration'}
              </div>
              {identity.email && (
                <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '12px' }}>
                  📧 {identity.email}
                </div>
              )}
              {identity.tech_stack && identity.tech_stack.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {identity.tech_stack.slice(0, 4).map(tech => (
                    <span key={tech} style={{
                      padding: '4px 10px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.5)',
                      borderRadius: '6px',
                      fontSize: '10px',
                      color: '#818cf8'
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Neural Metrics */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-title" style={{ marginBottom: '16px' }}>Neural Metrics</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {generateStatCard('Stored Memories', metrics.totalMemories, '🧠', '#0ea5e9')}
            {generateStatCard('Connected Nodes', metrics.connectedPlatforms, '🔗', '#10b981')}
          </div>
        </div>

        {/* Platform Connections */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-title" style={{ marginBottom: '16px' }}>Neural Network Nodes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'ChatGPT', icon: '🤖', status: true },
              { name: 'Claude', icon: '🎭', status: true },
              { name: 'Gemini', icon: '✨', status: false },
              { name: 'Copilot', icon: '🚀', status: false }
            ].map((platform) => (
              <div key={platform.name} className="memory-card" style={{
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: `3px solid ${platform.status ? 'var(--success)' : 'var(--border)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <span>{platform.icon}</span>
                  <span>{platform.name}</span>
                </div>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: platform.status ? '#10b981' : '#6b7280',
                  boxShadow: platform.status ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Memories Preview */}
        {memories.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div className="section-title" style={{ marginBottom: '16px' }}>Recent Neural Logs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {memories.slice(0, 3).map((memory) => (
                <div key={memory.id} className="memory-card" style={{ padding: '12px 16px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--accent)', fontSize: '10px', marginBottom: '4px' }}>
                    {memory.type?.toUpperCase()}
                  </div>
                  <div style={{ color: '#d1d5db', lineHeight: '1.4' }}>
                    {memory.summary || memory.content?.substring(0, 50)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'linear-gradient(135deg, var(--accent), #0284c7)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-3px)'
            ;(e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(14, 165, 233, 0.5)'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)'
            ;(e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.3)'
          }}
          onClick={() => {
            chrome.runtime.sendMessage({ type: "NEURAL_BRIDGE_INITIATED" })
          }}
        >
          ⚡ Initiate Neural Bridge Sync
        </button>

        <style>{`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 25px rgba(16, 185, 129, 0.8);
              transform: scale(1.1);
            }
            100% {
              box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default SidePanel
