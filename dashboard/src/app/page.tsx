"use client"

import { useEffect, useState } from "react"

interface Identity {
  role?: string
  goal?: string
  tech_stack?: string[]
}

interface Memory {
  id: string
  content: string
  summary?: string
  type: string
  timestamp: string
  tags?: string[]
}

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

export default function Dashboard() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeWorkspace, setActiveWorkspace] = useState("Personal")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async (query = "") => {
    try {
      // 1. Fetch Identity (or recent chats)
      const chatsRes = await fetch(`http://localhost:8000/recent_chats?workspace=${activeWorkspace}`)
      if (!chatsRes.ok) throw new Error("Backend offline")
      
      // 2. Fetch Memories
      const memoriesRes = await fetch(`http://localhost:8000/search_memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, workspace: activeWorkspace, limit: 10 })
      })
      const memoriesData = await memoriesRes.json()
      
      setMemories(memoriesData.memories || [])
      
      if (memoriesData.memories?.length > 0) {
        const idMemory = memoriesData.memories.find((m: any) => 
          m.type === "context" || (m.tags && m.tags.includes("identity"))
        )
        if (idMemory) {
          // Extract role/goal from content if possible
          setIdentity({ 
            role: idMemory.content.includes("Identity:") ? idMemory.content.split(":")[1].split("working")[0].trim() : "Neural Engineer", 
            goal: idMemory.content.includes("working on") ? idMemory.content.split("working on")[1].trim() : "Synchronizing Intelligence" 
          })
        }
      }

    } catch (error) {
      console.log("Dashboard fetch suppressed error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(searchQuery)
    const interval = setInterval(() => fetchData(searchQuery), 10000)
    return () => clearInterval(interval)
  }, [activeWorkspace, searchQuery])

  const handleConnect = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MINDBRIDGE <span style={{ color: 'var(--accent-primary)' }}>NEURAL DASHBOARD</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Real-time synchronization with AI Neural Bridge</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {["Personal", "Startup", "Research"].map(w => (
            <button 
              key={w}
              onClick={() => setActiveWorkspace(w)}
              style={{
                background: activeWorkspace === w ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                border: activeWorkspace === w ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                color: activeWorkspace === w ? 'var(--accent-primary)' : 'var(--text-muted)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        
        {/* LEFT COLUMN: IDENTITY & PLATFORMS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* IDENTITY CARD */}
          <section className="glass-panel animate-fade-in">
            <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.1em' }}>
              Active Neural Persona
            </div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>{identity?.role || "Neural Entity"}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                {identity?.goal || "Analyzing cross-platform interactions to build persistent context."}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {["React", "Next.js", "AI/ML", "TypeScript"].map(t => (
                <span key={t} style={{ background: 'rgba(160, 28, 255, 0.15)', border: '1px solid rgba(160, 28, 255, 0.3)', color: '#d8b4fe', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* PLATFORM CONNECTIONS */}
          <section className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.1em' }}>
              Neural Network Nodes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {platforms.map(p => (
                <div key={p.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{p.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <button 
                    onClick={() => handleConnect(p.url)}
                    className="neural-button"
                    style={{ 
                      padding: '6px 14px', 
                      fontSize: '11px',
                      background: activeWorkspace.toLowerCase().includes(p.id) ? 'var(--success)' : undefined
                    }}
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: MEMORIES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <section className="glass-panel animate-fade-in" style={{ flex: 1, animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Neural Memory Logs (ChromaDB)
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Search memories..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    outline: 'none',
                    width: '200px'
                  }}
                />
                <button onClick={() => fetchData(searchQuery)} className="neural-button" style={{ padding: '6px 12px', fontSize: '10px' }}>Refresh</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {memories.length > 0 ? memories.map((memory) => (
                <div key={memory.id} style={{ 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {memory.type}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {memory.timestamp ? new Date(memory.timestamp).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#e5e7eb' }}>
                    {memory.summary || memory.content}
                  </p>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>🧠</div>
                  <p>No neural memories synchronized yet.</p>
                  <p style={{ fontSize: '12px' }}>Initiate a sync from the MindBridge extension.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
        <div>MindBridge Neural Engine v0.1.0</div>
        <div>System Latency: 12ms | Storage: ChromaDB Vector Cloud</div>
      </footer>
    </div>
  )
}
