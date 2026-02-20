import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Footprints, Dumbbell, Droplets, Zap } from 'lucide-react'
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

export default function Dashboard() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('fittrack_user_id')
  const bmi = localStorage.getItem('fittrack_bmi')
  const bmiCategory = localStorage.getItem('fittrack_bmi_category')

  useEffect(() => {
    if (!userId) navigate('/')
  }, [userId, navigate])

  if (!userId) return null

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header animate-in">
          <div style={styles.headerTop}>
            <div>
              <h1 className="page-title">
                Welcome back <span className="gradient-text">👋</span>
              </h1>
              <p className="page-subtitle">Track your fitness journey with AI-powered insights.</p>
            </div>
            <div style={styles.bmiCard}>
              <span style={styles.bmiLabel}>Your BMI</span>
              <span style={styles.bmiValue}>{bmi}</span>
              <span className="badge badge-teal">{bmiCategory}</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div style={styles.grid}>
          {services.map((service, i) => (
            <div key={service.path} className="animate-in" style={{ animationDelay: `${i * 0.08}s` }}>
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
    color: 'var(--accent-teal)',
    lineHeight: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
}
