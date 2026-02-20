import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Plus, Sparkles } from 'lucide-react'
import { api } from '../api/client'
import AIReport from '../components/AIReport'

export default function WaterFitness() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('fittrack_user_id')

  const [glasses, setGlasses] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) { navigate('/'); return }
    fetchLogs()
  }, [userId])

  const fetchLogs = async () => {
    try {
      const data = await api.getWaterLogs(userId)
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
      await api.logWater({ user_id: parseInt(userId), glasses: parseInt(glasses), date })
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
      const data = await api.getFitnessSuggestions(userId)
      setSuggestions(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setFetchingSuggestions(false)
    }
  }

  const totalGlasses = logs.reduce((sum, l) => sum + l.glasses, 0)
  const totalLiters = (totalGlasses * 0.25).toFixed(1) // approx 250ml per glass

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
            <div className="history-list">
              {logs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No water logs yet</p>
              ) : (
                logs.map((log) => (
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
