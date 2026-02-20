import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footprints, Flame, Plus } from 'lucide-react'
import { api } from '../api/client'

export default function StepsTracker() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('fittrack_user_id')

  const [steps, setSteps] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) { navigate('/'); return }
    fetchLogs()
  }, [userId])

  const fetchLogs = async () => {
    try {
      const data = await api.getStepsLogs(userId)
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
      await api.logSteps({ user_id: parseInt(userId), steps: parseInt(steps), date })
      setSteps('')
      await fetchLogs()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const totalSteps = logs.reduce((sum, l) => sum + l.steps, 0)
  const totalCalories = logs.reduce((sum, l) => sum + l.calories_burnt, 0)
  const avgSteps = logs.length > 0 ? Math.round(totalSteps / logs.length) : 0

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
            <div className="history-list">
              {logs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No step logs yet</p>
              ) : (
                logs.map((log) => (
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
