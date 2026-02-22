import { useState, useEffect } from 'react'
import { useCopilotReadable } from '@copilotkit/react-core'
import { Footprints, Flame, Plus, Filter, X, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'

export default function StepsTracker() {
  const [steps, setSteps] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useEffect(() => {
    fetchLogs()

    const handler = (e) => {
      if (e.detail?.action === 'logSteps') fetchLogs()
    }
    window.addEventListener('copilot-action', handler)
    return () => window.removeEventListener('copilot-action', handler)
  }, [])

  const fetchLogs = async () => {
    try {
      const data = await api.getStepsLogs()
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
      await api.logSteps({ steps: parseInt(steps), date })
      setSteps('')
      await fetchLogs()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter + Stats
  const filteredLogs = logs.filter((l) => {
    if (filterFrom && l.date < filterFrom) return false
    if (filterTo && l.date > filterTo) return false
    return true
  })
  const totalSteps = filteredLogs.reduce((sum, l) => sum + l.steps, 0)
  const totalCalories = filteredLogs.reduce((sum, l) => sum + l.calories_burnt, 0)
  const avgSteps = filteredLogs.length > 0 ? Math.round(totalSteps / filteredLogs.length) : 0

  useCopilotReadable({
    description: "User's step tracking logs and summary stats",
    value: { logs, totalSteps, totalCalories, avgSteps },
  })



  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">
            <Footprints size={28} style={{ color: 'var(--accent-teal)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Step Tracker
          </h1>
          <p className="page-subtitle">Track your daily steps and calories burnt.</p>
        </div>

        {/* Stats Row */}
        <div className="grid-3 animate-in" style={{ marginBottom: '2rem' }}>
          <div className="glass-card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>{totalSteps.toLocaleString()}</div>
            <div className="stat-label">Total Steps</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{totalCalories.toFixed(0)}</div>
            <div className="stat-label">Total Calories</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{avgSteps.toLocaleString()}</div>
            <div className="stat-label">Avg Steps/Day</div>
          </div>
        </div>

        {/* Steps Trend Chart */}
        {filteredLogs.length > 1 && (
          <div className="chart-container animate-in" style={{ animationDelay: '0.08s' }}>
            <h3><TrendingUp size={18} style={{ color: 'var(--accent-teal)' }} /> Steps Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={[...filteredLogs].reverse()}>
                <defs>
                  <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f9fafb' }}
                />
                <Area type="monotone" dataKey="steps" stroke="#2dd4bf" fill="url(#stepsGrad)" strokeWidth={2} name="Steps" />
                <Area type="monotone" dataKey="calories_burnt" stroke="#fbbf24" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Calories" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Log Form */}
          <div className="glass-card animate-in">
            <h3 style={styles.cardTitle}>
              <Plus size={18} style={{ color: 'var(--accent-teal)' }} />
              Log Steps
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Number of Steps</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 8000"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  required
                  min="1"
                  id="steps-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  id="steps-date-input"
                />
              </div>

              {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} id="log-steps-btn">
                {loading ? <><div className="spinner" /> Logging...</> : 'Log Steps'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1rem' }}>Step History</h3>

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
              {filteredLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  {logs.length === 0 ? 'No step logs yet' : 'No logs match the selected dates'}
                </p>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="history-item">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        <Footprints size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                        {log.steps.toLocaleString()} steps
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {log.date}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                        <Flame size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        {' '}{log.calories_burnt} cal
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
