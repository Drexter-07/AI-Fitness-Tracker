import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, Heart, Moon, Footprints, Dumbbell, Droplets, Zap } from 'lucide-react'
import { api } from '../api/client'

export default function Landing() {
  const navigate = useNavigate()
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      localStorage.setItem('fittrack_user_id', data.user_id)
      localStorage.setItem('fittrack_bmi', data.bmi)
      localStorage.setItem('fittrack_bmi_category', data.bmi_category)
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

  const features = [
    { icon: Moon, label: 'Sleep Tracking', color: 'var(--accent-purple)' },
    { icon: Footprints, label: 'Step Counter', color: 'var(--accent-teal)' },
    { icon: Dumbbell, label: 'Workouts', color: 'var(--accent-pink)' },
    { icon: Droplets, label: 'Hydration', color: 'var(--accent-blue)' },
    { icon: Zap, label: 'Energy Score', color: 'var(--accent-amber)' },
    { icon: Heart, label: 'AI Insights', color: 'var(--accent-red)' },
  ]

  return (
    <div style={styles.page}>
      {/* Hero Background */}
      <div style={styles.heroBg}>
        <div style={styles.glowOrb1} />
        <div style={styles.glowOrb2} />
      </div>

      <div className="container" style={styles.content}>
        {/* Hero Section */}
        <div style={styles.hero} className="animate-in">
          <div style={styles.heroBadge}>
            <Activity size={14} />
            <span>AI-Powered Fitness Tracking</span>
          </div>
          <h1 style={styles.heroTitle}>
            Your Personal<br />
            <span className="gradient-text">Fitness Companion</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Track your fitness journey with AI-powered insights. Get personalized reports
            on sleep quality, workout effectiveness, and daily energy levels.
          </p>
        </div>

        {/* Features Strip */}
        <div style={styles.featureStrip} className="animate-in">
          {features.map(({ icon: Icon, label, color }) => (
            <div key={label} style={styles.featureItem}>
              <Icon size={18} style={{ color }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* BMI Form */}
        <div style={styles.formSection} className="animate-in">
          <div className="glass-card" style={styles.formCard}>
            <h2 style={styles.formTitle}>
              <Heart size={22} style={{ color: 'var(--accent-teal)' }} />
              Start Your Journey
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              Enter your measurements for an accurate BMI calculation and personalized tracking.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
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
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
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
                  <>Calculate BMI <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            {/* BMI Result */}
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
  page: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: '2rem',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    background: 'var(--gradient-hero)',
    zIndex: -1,
  },
  glowOrb1: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(45, 212, 191, 0.12) 0%, transparent 70%)',
    filter: 'blur(40px)',
    animation: 'pulse 4s ease-in-out infinite',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%)',
    filter: 'blur(40px)',
    animation: 'pulse 5s ease-in-out infinite reverse',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  hero: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto',
    padding: '3rem 0 2rem',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 1rem',
    borderRadius: '9999px',
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    color: 'var(--accent-teal)',
    fontSize: '0.8125rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 900,
    lineHeight: 1.1,
    marginBottom: '1.25rem',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '1.125rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '550px',
    margin: '0 auto',
  },
  featureStrip: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    padding: '2rem 0',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
  },
  formSection: {
    maxWidth: '540px',
    margin: '0 auto',
    paddingBottom: '4rem',
  },
  formCard: {
    padding: '2rem',
  },
  formTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
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
