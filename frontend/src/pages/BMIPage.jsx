import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ArrowRight, ArrowLeft, Ruler, Weight } from 'lucide-react'
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function BMIPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const isUpdate = !!(user?.bmi)

  const [height, setHeight] = useState(user?.height_cm ? String(user.height_cm) : '')
  const [weight, setWeight] = useState(user?.weight_kg ? String(user.weight_kg) : '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── CopilotKit: expose current height/weight to the AI ──
  useCopilotReadable({
    description: 'Current height and weight values on the BMI page',
    value: { height, weight, bmiResult: result },
  })

  // ── CopilotKit: let the AI set height and weight ──
  useCopilotAction({
    name: 'setBMIInputs',
    description: 'Set the height (cm) and/or weight (kg) on the BMI calculator form',
    parameters: [
      { name: 'height', type: 'number', description: 'Height in cm', required: false },
      { name: 'weight', type: 'number', description: 'Weight in kg', required: false },
    ],
    handler: ({ height: h, weight: w }) => {
      if (h !== undefined) setHeight(String(h))
      if (w !== undefined) setWeight(String(w))
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.calculateBMI({
        height_cm: parseFloat(height),
        weight_kg: parseFloat(weight),
      })
      setResult(data)
      await refreshUser()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getBMIColor = (category) => {
    switch (category) {
      case 'Underweight': return 'var(--accent-amber)'
      case 'Normal weight': return 'var(--accent-green)'
      case 'Overweight': return 'var(--accent-amber)'
      case 'Obese': return 'var(--accent-red)'
      default: return 'var(--accent-teal)'
    }
  }

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header animate-in">
          <div style={styles.headerRow}>
            <div>
              <h1 className="page-title">
                <Heart size={28} style={{ color: 'var(--accent-teal)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                {isUpdate ? 'Update Your BMI' : 'Set Up Your BMI'}
              </h1>
              <p className="page-subtitle">
                {isUpdate
                  ? 'Update your height and weight to keep your BMI and calorie calculations accurate.'
                  : 'Enter your measurements for an accurate BMI calculation and personalized tracking.'}
              </p>
            </div>
            {isUpdate && (
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            )}
          </div>
        </div>

        <div style={styles.layout}>
          {/* Current BMI card (for existing users) */}
          {isUpdate && user?.bmi && !result && (
            <div className="glass-card animate-in" style={styles.currentCard}>
              <h3 style={styles.sectionTitle}>Current BMI</h3>
              <div style={styles.currentGrid}>
                <div style={styles.currentItem}>
                  <span style={styles.currentLabel}>BMI Value</span>
                  <span style={{ ...styles.currentValue, color: getBMIColor(user.bmi_category) }}>
                    {user.bmi}
                  </span>
                </div>
                <div style={styles.currentItem}>
                  <span style={styles.currentLabel}>Category</span>
                  <span className="badge" style={{
                    background: `${getBMIColor(user.bmi_category)}20`,
                    color: getBMIColor(user.bmi_category),
                    fontSize: '0.875rem',
                    padding: '0.375rem 1rem',
                  }}>
                    {user.bmi_category}
                  </span>
                </div>
                <div style={styles.currentItem}>
                  <span style={styles.currentLabel}>Height</span>
                  <span style={styles.currentStat}>{user.height_cm} cm</span>
                </div>
                <div style={styles.currentItem}>
                  <span style={styles.currentLabel}>Weight</span>
                  <span style={styles.currentStat}>{user.weight_kg} kg</span>
                </div>
              </div>
            </div>
          )}

          {/* BMI Form */}
          <div className="glass-card animate-in" style={{ animationDelay: '0.1s', maxWidth: '540px', margin: isUpdate ? '0' : '0 auto' }}>
            <h3 style={styles.sectionTitle}>
              <Ruler size={18} style={{ color: 'var(--accent-teal)' }} />
              {isUpdate ? 'Update Measurements' : 'Enter Your Measurements'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <div style={styles.inputRow}>
                  <Ruler size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    min="50"
                    max="300"
                    id="height-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <div style={styles.inputRow}>
                  <Weight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    min="10"
                    max="500"
                    id="weight-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {error && (
                <p style={{ color: 'var(--accent-red)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading}
                id="calculate-bmi-btn"
              >
                {loading ? (
                  <><div className="spinner" /> Calculating...</>
                ) : (
                  <>{isUpdate ? 'Update BMI' : 'Calculate BMI'} <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            {/* Result */}
            {result && (
              <div style={styles.resultCard} className="animate-in">
                <div style={styles.resultGrid}>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Your BMI</span>
                    <span style={{ ...styles.resultValue, color: getBMIColor(result.bmi_category) }}>
                      {result.bmi}
                    </span>
                  </div>
                  <div style={styles.resultItem}>
                    <span style={styles.resultLabel}>Category</span>
                    <span className="badge" style={{
                      background: `${getBMIColor(result.bmi_category)}20`,
                      color: getBMIColor(result.bmi_category),
                    }}>
                      {result.bmi_category}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '1.5rem' }}
                  onClick={() => navigate('/dashboard')}
                  id="go-dashboard-btn"
                >
                  Go to Dashboard <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  backBtn: {
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2rem',
    alignItems: 'start',
  },
  currentCard: {
    padding: '2rem',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
  },
  currentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  currentItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    alignItems: 'center',
    textAlign: 'center',
  },
  currentLabel: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 500,
  },
  currentValue: {
    fontSize: '2.5rem',
    fontWeight: 900,
    lineHeight: 1,
  },
  currentStat: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  resultCard: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(45, 212, 191, 0.06)',
    border: '1px solid rgba(45, 212, 191, 0.15)',
  },
  resultGrid: {
    display: 'flex',
    justifyContent: 'space-around',
    textAlign: 'center',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 500,
  },
  resultValue: {
    fontSize: '2.5rem',
    fontWeight: 900,
    lineHeight: 1,
  },
}
