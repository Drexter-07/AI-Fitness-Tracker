import { useState, useEffect } from 'react'
import { useCopilotReadable } from '@copilotkit/react-core'
import { Moon, Clock, Sparkles, Filter, X, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'
import AIReport from '../components/AIReport'

export default function SleepTracker() {
  const [sleepTime, setSleepTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useCopilotReadable({
    description: "User's sleep logs with sleep time, wake time, and duration in hours",
    value: logs,
  })



  useEffect(() => {
    fetchLogs()

    // Refresh data when AI logs sleep via global action
    const handler = (e) => {
      if (e.detail?.action === 'logSleep') fetchLogs()
    }
    window.addEventListener('copilot-action', handler)
    return () => window.removeEventListener('copilot-action', handler)
  }, [])

  const fetchLogs = async () => {
    try {
      const data = await api.getSleepLogs()
      setLogs(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.logSleep({ sleep_time: sleepTime, wake_time: wakeTime })
      setSleepTime('')
      setWakeTime('')
      await fetchLogs()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async (logId) => {
    setAnalysis(null)
    setAnalyzing(true)
    try {
      const data = await api.analyzeSleep({ sleep_log_id: logId })
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">
            <Moon size={28} style={{ color: 'var(--accent-purple)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Sleep Tracker
          </h1>
          <p className="page-subtitle">Log your sleep schedule and get AI-powered quality analysis.</p>
        </div>

        {/* Sleep Duration Chart */}
        {logs.length > 1 && (
          <div className="chart-container animate-in" style={{ animationDelay: '0.06s' }}>
            <h3><TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} /> Sleep Duration Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...logs].reverse().map(l => ({ ...l, label: l.created_at?.split('T')[0] || '' }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} unit="h" />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f9fafb' }} />
                <Bar dataKey="duration_hours" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Duration (hrs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Log Form */}
          <div className="glass-card animate-in">
            <h3 style={styles.cardTitle}>
              <Clock size={18} style={{ color: 'var(--accent-purple)' }} />
              Log Sleep
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Went to Sleep At</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 10:00 PM"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  required
                  id="sleep-time-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Woke Up At</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 6:00 AM"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  required
                  id="wake-time-input"
                />
              </div>

              {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} id="log-sleep-btn">
                {loading ? <><div className="spinner" /> Logging...</> : 'Log Sleep'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1rem' }}>Sleep History</h3>

            <div className="date-filter-bar">
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <label>From</label>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              <label>To</label>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              {(filterFrom || filterTo) && (
                <button className="btn btn-ghost" onClick={() => { setFilterFrom(''); setFilterTo('') }}>
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            <div className="history-list">
              {(() => {
                const filtered = logs.filter((log) => {
                  const d = log.created_at?.split('T')[0]
                  if (filterFrom && d < filterFrom) return false
                  if (filterTo && d > filterTo) return false
                  return true
                })
                if (filtered.length === 0) {
                  return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    {logs.length === 0 ? 'No sleep logs yet' : 'No logs match the selected dates'}
                  </p>
                }
                return filtered.map((log) => (
                  <div key={log.id} className="history-item">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {log.sleep_time} → {log.wake_time}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {log.duration_hours}h sleep
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAnalyze(log.id)}
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                    >
                      <Sparkles size={14} /> Analyze
                    </button>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <AIReport analysis={analysis} loading={analyzing} />
      </div>
    </div>
  )
}

const styles = {
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
  },
}
