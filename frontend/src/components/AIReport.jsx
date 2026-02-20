import { Sparkles } from 'lucide-react'

export default function AIReport({ analysis, loading }) {
  if (loading) {
    return (
      <div className="ai-report animate-in">
        <h3><Sparkles size={18} /> AI Analysis</h3>
        <div className="loading-container" style={{ padding: '2rem' }}>
          <div className="spinner" />
          <p>Generating personalized insights...</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  // Basic markdown-like rendering
  const renderContent = (text) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} style={{ color: 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{line.replace('### ', '')}</h4>
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} style={{ color: 'var(--accent-teal)', marginTop: '1.25rem', marginBottom: '0.25rem', fontSize: '1.05rem' }}>{line.replace('## ', '')}</h3>
      }
      if (line.startsWith('# ')) {
        return <h2 key={i} style={{ color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{line.replace('# ', '')}</h2>
      }
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.replace(/^[-*] /, '')
        return (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
            <span style={{ color: 'var(--accent-teal)' }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
          </div>
        )
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)[1]
        const content = line.replace(/^\d+\.\s*/, '')
        return (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 600, minWidth: '1.25rem' }}>{num}.</span>
            <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
          </div>
        )
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={i} style={{ height: '0.5rem' }} />
      }
      // Normal paragraph
      return <p key={i} style={{ marginBottom: '0.25rem' }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />
    })
  }

  const boldify = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/__(.*?)__/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:0.1rem 0.3rem;border-radius:4px;font-size:0.85em">$1</code>')
  }

  return (
    <div className="ai-report animate-in">
      <h3><Sparkles size={18} /> AI Analysis</h3>
      <div className="ai-report-content">
        {renderContent(analysis)}
      </div>
    </div>
  )
}
