import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Footprints, Dumbbell, Droplets, Zap, Heart, Pencil, Flame } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import ServiceCard from '../components/ServiceCard'

const services = [
  {
    title: 'Sleep Tracker',
    description: 'Log your sleep patterns and get AI-powered quality analysis with personalized suggestions.',
    icon: Moon,
    path: '/sleep',
    gradient: 'var(--gradient-card-sleep)',
    color: 'var(--accent-purple)',
  },
  {
    title: 'Step Counter',
    description: 'Track daily steps and calories burnt with weight-adjusted calculations.',
    icon: Footprints,
    path: '/steps',
    gradient: 'var(--gradient-card-steps)',
    color: 'var(--accent-teal)',
  },
  {
    title: 'Workout Log',
    description: 'Record walking, running, strength training, and more. Get AI workout analysis.',
    icon: Dumbbell,
    path: '/workout',
    gradient: 'var(--gradient-card-workout)',
    color: 'var(--accent-pink)',
  },
  {
    title: 'Water & Wellness',
    description: 'Track hydration and get personalized fitness suggestions powered by AI.',
    icon: Droplets,
    path: '/water',
    gradient: 'var(--gradient-card-water)',
    color: 'var(--accent-blue)',
  },
  {
    title: 'Energy Score',
    description: 'See your daily energy score calculated from sleep and workout data.',
    icon: Zap,
    path: '/energy',
    gradient: 'var(--gradient-card-energy)',
    color: 'var(--accent-amber)',
  },
]

const todayCards = [
  { key: 'sleep_hours', label: 'Sleep', unit: 'hrs', icon: Moon, color: 'var(--accent-purple)' },
  { key: 'steps', label: 'Steps', unit: '', icon: Footprints, color: 'var(--accent-teal)' },
  { key: 'calories_burnt', label: 'Calories', unit: 'kcal', icon: Flame, color: 'var(--accent-amber)' },
  { key: 'water_glasses', label: 'Water', unit: 'glasses', icon: Droplets, color: 'var(--accent-blue)' },
  { key: 'workout_minutes', label: 'Workout', unit: 'min', icon: Dumbbell, color: 'var(--accent-pink)' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [today, setToday] = useState(null)

  useEffect(() => {
    api.getDashboardToday().then(setToday).catch(console.error)
  }, [])

  const getBMIColor = () => {
    if (!user?.bmi_category) return 'var(--accent-teal)'
    switch (user.bmi_category) {
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
          <div style={styles.headerTop}>
            <div>
              <h1 className="page-title">
                Welcome back, <span className="gradient-text">{user?.name || 'User'} 👋</span>
              </h1>
              <p className="page-subtitle">Track your fitness journey with AI-powered insights.</p>
            </div>

            {/* Clickable BMI card → links to /bmi */}
            <Link to="/bmi" style={{ textDecoration: 'none' }}>
              <div style={styles.bmiCard}>
                <div style={styles.bmiTop}>
                  <span style={styles.bmiLabel}>Your BMI</span>
                  <Pencil size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
                <span style={{ ...styles.bmiValue, color: getBMIColor() }}>
                  {user?.bmi || '—'}
                </span>
                <span className="badge" style={{
                  background: `${getBMIColor()}20`,
                  color: getBMIColor(),
                }}>
                  {user?.bmi_category || 'Click to set'}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Today's Summary */}
        {today && (
          <div className="animate-in" style={{ animationDelay: '0.06s', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Today's Progress
            </h3>
            <div className="grid-5 today-stats-row">
              {todayCards.map(({ key, label, unit, icon: Icon, color }) => (
                <div key={key} className="glass-card today-stat-card">
                  <Icon size={18} style={{ color, marginBottom: '0.375rem' }} />
                  <div className="today-stat-value" style={{ color }}>
                    {key === 'steps' ? (today[key] || 0).toLocaleString() : (today[key] || 0)}
                  </div>
                  <div className="today-stat-label">
                    {unit ? `${label} (${unit})` : label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div style={styles.grid}>
          {services.map((service, i) => (
            <div key={service.path} className="animate-in" style={{ animationDelay: `${(i + 2) * 0.08}s` }}>
              <ServiceCard {...service} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  bmiCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '1rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px',
  },
  bmiTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    justifyContent: 'center',
  },
  bmiLabel: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 500,
  },
  bmiValue: {
    fontSize: '2rem',
    fontWeight: 900,
    lineHeight: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
}
