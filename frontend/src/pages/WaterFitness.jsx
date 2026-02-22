import { useState, useEffect } from 'react'
import { useCopilotReadable } from '@copilotkit/react-core'
import { Droplets, Plus, Sparkles, Filter, X, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'
import AIReport from '../components/AIReport'

export default function WaterFitness() {
  const [glasses, setGlasses] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [error, setError] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useEffect(() => {
    fetchLogs()

    const handler = (e) => {
      if (e.detail?.action === 'logWater') fetchLogs()
    }
    window.addEventListener('copilot-action', handler)
    return () => window.removeEventListener('copilot-action', handler)
  }, [])

  const fetchLogs = async () => {
    try {
      const data = await api.getWaterLogs()
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
      await api.logWater({ glasses: parseInt(glasses), date })
      setGlasses('')
      await fetchLogs()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetSuggestions = async () => {
    setSuggestions(null)
    setFetchingSuggestions(true)
    try {
      const data = await api.getFitnessSuggestions()
      setSuggestions(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setFetchingSuggestions(false)
    }
  }

  // Filter + Stats
  const filteredLogs = logs.filter((l) => {
    if (filterFrom && l.date < filterFrom) return false
    if (filterTo && l.date > filterTo) return false
    return true
  })
  const totalGlasses = filteredLogs.reduce((sum, l) => sum + l.glasses, 0)
  const totalLiters = (totalGlasses * 0.25).toFixed(1) // approx 250ml per glass

  useCopilotReadable({
    description: "User's water intake logs and hydration summary",
    value: { logs, totalGlasses, totalLiters },
  })



  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">
            <Droplets size={28} style={{ color: 'var(--accent-blue)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Water & Wellness
          </h1>
          <p className="page-subtitle">Track hydration and get AI-powered fitness suggestions.</p>
        </div>

        {/* Stats */}
        <div className="grid-2 animate-in" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
          <div className="glass-card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{totalGlasses}</div>
            <div className="stat-label">Total Glasses</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>{totalLiters}L</div>
            <div className="stat-label">Approx Volume</div>
          </div>
        </div>

        {/* Water Intake Chart */}
        {filteredLogs.length > 1 && (
          <div className="chart-container animate-in" style={{ animationDelay: '0.06s' }}>
            <h3><TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} /> Daily Water Intake</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...filteredLogs].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f9fafb' }} />
                <Bar dataKey="glasses" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Glasses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Log Form */}
          <div className="animate-in">
            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={styles.cardTitle}>
                <Plus size={18} style={{ color: 'var(--accent-blue)' }} />
                Log Water Intake
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Glasses of Water</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 8"
                    value={glasses}
                    onChange={(e) => setGlasses(e.target.value)}
                    required
                    min="1"
                    id="water-glasses-input"
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
                    id="water-date-input"
                  />
                </div>

                {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} id="log-water-btn">
                  {loading ? <><div className="spinner" /> Logging...</> : 'Log Water'}
                </button>
              </form>
            </div>

            {/* Get Suggestions Button */}
            <button className="btn btn-secondary btn-lg" style={{ width: '100%' }} onClick={handleGetSuggestions} disabled={fetchingSuggestions} id="get-suggestions-btn">
              <Sparkles size={18} />
              {fetchingSuggestions ? 'Getting AI Suggestions...' : 'Get AI Fitness Suggestions'}
            </button>
          </div>

          {/* History */}
          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1rem' }}>Water Log</h3>

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
                  {logs.length === 0 ? 'No water logs yet' : 'No logs match the selected dates'}
                </p>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="history-item">
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        <Droplets size={14} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--accent-blue)', marginRight: '0.25rem' }} />
                        {log.glasses} glasses
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {log.date}
                      </div>
                    </div>
                    <span style={{ color: 'var(--accent-teal)', fontSize: '0.875rem', fontWeight: 600 }}>
                      ~{(log.glasses * 0.25).toFixed(1)}L
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        <AIReport analysis={suggestions} loading={fetchingSuggestions} />
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
