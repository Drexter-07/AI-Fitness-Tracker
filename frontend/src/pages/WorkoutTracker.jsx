import { useState, useEffect } from 'react'
import { useCopilotReadable } from '@copilotkit/react-core'
import { Dumbbell, Flame, Sparkles, Plus, Filter, X } from 'lucide-react'
import { api } from '../api/client'
import AIReport from '../components/AIReport'

const WORKOUT_TYPES = ['walking', 'running', 'strength', 'misc']
const INTENSITIES = ['low', 'moderate', 'high']

export default function WorkoutTracker() {
  const [workoutType, setWorkoutType] = useState('walking')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('moderate')
  const [notes, setNotes] = useState('')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useCopilotReadable({
    description: "User's workout logs with exercise type, duration in minutes, intensity, and calories burnt",
    value: logs,
  })



  useEffect(() => {
    fetchLogs()

    const handler = (e) => {
      if (e.detail?.action === 'logWorkout') fetchLogs()
    }
    window.addEventListener('copilot-action', handler)
    return () => window.removeEventListener('copilot-action', handler)
  }, [])

  const fetchLogs = async () => {
    try {
      const data = await api.getWorkoutLogs()
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
      await api.logWorkout({
        workout_type: workoutType,
        duration_min: parseFloat(duration),
        intensity,
        notes: notes || null,
      })
      setDuration('')
      setNotes('')
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
      const data = await api.analyzeWorkout({ workout_log_id: logId })
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const getTypeIcon = (type) => {
    const colors = {
      walking: 'var(--accent-teal)',
      running: 'var(--accent-pink)',
      strength: 'var(--accent-purple)',
      misc: 'var(--accent-amber)',
    }
    return colors[type] || 'var(--text-secondary)'
  }

  const getIntensityBadge = (intensity) => {
    const map = { low: 'badge-green', moderate: 'badge-amber', high: 'badge-red' }
    return map[intensity] || 'badge-teal'
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">
            <Dumbbell size={28} style={{ color: 'var(--accent-pink)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Workout Tracker
          </h1>
          <p className="page-subtitle">Log workouts and get AI-powered effectiveness analysis.</p>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Log Form */}
          <div className="glass-card animate-in">
            <h3 style={styles.cardTitle}>
              <Plus size={18} style={{ color: 'var(--accent-pink)' }} />
              Log Workout
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Workout Type</label>
                <select className="form-select" value={workoutType} onChange={(e) => setWorkoutType(e.target.value)} id="workout-type-select">
                  {WORKOUT_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    min="1"
                    id="workout-duration-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Intensity</label>
                  <select className="form-select" value={intensity} onChange={(e) => setIntensity(e.target.value)} id="workout-intensity-select">
                    {INTENSITIES.map(i => (
                      <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Any notes about this workout..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  id="workout-notes-input"
                />
              </div>

              {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} id="log-workout-btn">
                {loading ? <><div className="spinner" /> Logging...</> : 'Log Workout'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="animate-in" style={{ animationDelay: '0.1s' }}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1rem' }}>Workout History</h3>

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
                    {logs.length === 0 ? 'No workouts yet' : 'No workouts match the selected dates'}
                  </p>
                }
                return filtered.map((log) => (
                  <div key={log.id} className="history-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTypeIcon(log.workout_type) }} />
                          {log.workout_type.charAt(0).toUpperCase() + log.workout_type.slice(1)}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {log.duration_min} min • <span className={`badge ${getIntensityBadge(log.intensity)}`}>{log.intensity}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                          <Flame size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                          {' '}{log.calories_burnt} cal
                        </div>
                      </div>
                    </div>
                    {log.notes && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{log.notes}</div>
                    )}
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAnalyze(log.id)}
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', alignSelf: 'flex-end' }}
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
