import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Moon, Dumbbell, RefreshCw } from 'lucide-react'
import { api } from '../api/client'

export default function EnergyScore() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('fittrack_user_id')

  const [energy, setEnergy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) { navigate('/'); return }
  }, [userId])

  const fetchScore = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getEnergyScore(userId)
      setEnergy(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-green)'
    if (score >= 60) return 'var(--accent-teal)'
    if (score >= 40) return 'var(--accent-amber)'
    return 'var(--accent-red)'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Moderate'
    return 'Low'
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">
            <Zap size={28} style={{ color: 'var(--accent-amber)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Energy Score
          </h1>
          <p className="page-subtitle">Your energy level based on sleep and workout patterns.</p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Generate Button */}
          {!energy && !loading && (
            <div className="animate-in" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Calculate your energy score based on your recent sleep and workout data.
              </p>
              <button className="btn btn-primary btn-lg" onClick={fetchScore} id="calculate-energy-btn">
                <Zap size={20} /> Calculate Energy Score
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="loading-container animate-fade">
              <div className="spinner" style={{ width: '32px', height: '32px' }} />
              <p>Calculating your energy score...</p>
            </div>
          )}

          {error && <p style={{ color: 'var(--accent-red)', textAlign: 'center', padding: '1rem' }}>{error}</p>}

          {/* Score Display */}
          {energy && !loading && (
            <div className="animate-in">
              {/* Gauge */}
              <div className="glass-card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div
                  className="energy-gauge"
                  style={{ '--score-percent': `${energy.score}%`, margin: '0 auto 1.5rem' }}
                >
                  <div className="energy-gauge-inner">
                    <span className="energy-gauge-score" style={{ color: getScoreColor(energy.score) }}>
                      {energy.score}
                    </span>
                    <span className="energy-gauge-label">out of 100</span>
                  </div>
                </div>

                <span
                  className="badge"
                  style={{
                    background: `${getScoreColor(energy.score)}20`,
                    color: getScoreColor(energy.score),
                    fontSize: '0.875rem',
                    padding: '0.375rem 1rem',
                  }}
                >
                  {getScoreLabel(energy.score)}
                </span>
              </div>

              {/* Breakdown */}
              <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Moon size={18} style={{ color: 'var(--accent-purple)' }} />
                    <span style={{ fontWeight: 600 }}>Sleep Factor</span>
                  </div>
                  <div style={styles.factorBar}>
                    <div style={{ ...styles.factorFill, width: `${(energy.sleep_factor / 50) * 100}%`, background: 'var(--accent-purple)' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {energy.sleep_factor}/50 points
                  </span>
                </div>

                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Dumbbell size={18} style={{ color: 'var(--accent-pink)' }} />
                    <span style={{ fontWeight: 600 }}>Workout Factor</span>
                  </div>
                  <div style={styles.factorBar}>
                    <div style={{ ...styles.factorFill, width: `${(energy.workout_factor / 50) * 100}%`, background: 'var(--accent-pink)' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {energy.workout_factor}/50 points
                  </span>
                </div>
              </div>

              {/* Details */}
              {energy.details && (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{energy.details}</p>
                </div>
              )}

              {/* Refresh */}
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={fetchScore} id="refresh-energy-btn">
                  <RefreshCw size={16} /> Recalculate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  factorBar: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.06)',
    marginBottom: '0.5rem',
    overflow: 'hidden',
  },
  factorFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
