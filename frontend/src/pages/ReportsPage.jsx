import { useState, useEffect } from 'react'
import { FileText, Sparkles, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { api } from '../api/client'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [generating, setGenerating] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const data = await api.getReports()
      setReports(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const report = await api.generateWeeklyReport()
      // Put the new/updated report at the top
      setReports((prev) => {
        const filtered = prev.filter((r) => r.id !== report.id)
        return [report, ...filtered]
      })
      setExpandedId(report.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const formatDateRange = (start, end) => {
    const fmtDate = (d) => {
      const date = new Date(d + 'T00:00:00')
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    const endDate = new Date(end + 'T00:00:00')
    const year = endDate.getFullYear()
    return `${fmtDate(start)} – ${fmtDate(end)}, ${year}`
  }

  const renderMarkdown = (text) => {
    // Simple markdown → HTML conversion for reports
    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">
            <FileText size={28} style={{ color: 'var(--accent-teal)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Weekly Reports
          </h1>
          <p className="page-subtitle">AI-generated fitness summaries analyzing your weekly progress.</p>
        </div>

        {/* Generate Button */}
        <div className="animate-in" style={{ marginBottom: '2rem' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={generating}
            id="generate-report-btn"
          >
            {generating ? (
              <><div className="spinner" /> Generating Report...</>
            ) : (
              <><Sparkles size={20} /> Generate This Week's Report</>
            )}
          </button>
          {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}
        </div>

        {/* Reports List */}
        <div className="animate-in" style={{ animationDelay: '0.08s' }}>
          {reports.length === 0 && !generating ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <FileText size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No reports yet. Generate your first weekly report!</p>
            </div>
          ) : (
            reports.map((report) => {
              const isExpanded = expandedId === report.id
              return (
                <div
                  key={report.id}
                  className={`report-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => !isExpanded && setExpandedId(report.id)}
                >
                  <div className="report-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Calendar size={16} style={{ color: 'var(--accent-teal)' }} />
                      <span className="report-date">{formatDateRange(report.week_start, report.week_end)}</span>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : report.id) }}
                      style={{ padding: '0.25rem' }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      className="report-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(report.report_text) }}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
