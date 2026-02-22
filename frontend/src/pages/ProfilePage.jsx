import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Shield, Calendar, Heart, Moon, Footprints, Dumbbell, Droplets, Pencil, Target, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [goals, setGoals] = useState(null)
  const [isEditingGoals, setIsEditingGoals] = useState(false)
  const [goalForm, setGoalForm] = useState({ step_goal: 10000, sleep_goal: 8.0, water_goal: 8, calorie_goal: 2500 })

  const fetchGoals = () => {
    api.getGoals().then(res => {
      setGoals(res)
      setGoalForm({
        step_goal: res.step_goal,
        sleep_goal: res.sleep_goal,
        water_goal: res.water_goal,
        calorie_goal: res.calorie_goal
      })
    }).catch(console.error)
  }

  useEffect(() => {
    api.getProfileStats().then(setStats).catch(console.error)
    fetchGoals()

    // Refresh data when AI updates goals via global action
    const handler = (e) => {
      if (e.detail?.action === 'updateGoals') fetchGoals()
    }
    window.addEventListener('copilot-action', handler)
    return () => window.removeEventListener('copilot-action', handler)
  }, [])

  const handleGoalSubmit = async (e) => {
    e.preventDefault()
    try {
      const updated = await api.updateGoals({
        step_goal: parseInt(goalForm.step_goal),
        sleep_goal: parseFloat(goalForm.sleep_goal),
        water_goal: parseInt(goalForm.water_goal),
        calorie_goal: parseInt(goalForm.calorie_goal)
      })
      setGoals(updated)
      setIsEditingGoals(false)
    } catch (err) {
      console.error(err)
      alert('Failed to update goals')
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

  const statCards = [
    { label: 'Sleep Logs', value: stats?.sleep_count ?? '—', icon: Moon, color: 'var(--accent-purple)', path: '/sleep' },
    { label: 'Step Logs', value: stats?.steps_count ?? '—', icon: Footprints, color: 'var(--accent-teal)', path: '/steps' },
    { label: 'Workouts', value: stats?.workout_count ?? '—', icon: Dumbbell, color: 'var(--accent-pink)', path: '/workout' },
    { label: 'Water Logs', value: stats?.water_count ?? '—', icon: Droplets, color: 'var(--accent-blue)', path: '/water' },
  ]

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">
            <User size={28} style={{ color: 'var(--accent-teal)', display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Your Profile
          </h1>
          <p className="page-subtitle">Account information and fitness tracking summary.</p>
        </div>

        <div className="profile-layout">
          {/* Account Info */}
          <div className="glass-card animate-in profile-info-card">
            <div className="profile-avatar">
              <User size={36} />
            </div>
            <h2 className="profile-name">{user?.name || 'User'}</h2>

            <div className="profile-details">
              <div className="profile-detail-item">
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <span>{user?.email}</span>
              </div>
              <div className="profile-detail-item">
                <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ textTransform: 'capitalize' }}>{user?.auth_provider === 'google' ? 'Google Account' : 'Email & Password'}</span>
              </div>
              <div className="profile-detail-item">
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <span>Joined {createdDate}</span>
              </div>
            </div>
          </div>

          {/* BMI Card */}
          <div className="glass-card animate-in profile-bmi-card" style={{ animationDelay: '0.08s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>
                <Heart size={18} style={{ color: 'var(--accent-teal)' }} />
                Body Mass Index
              </h3>
              <Link to="/bmi" className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                <Pencil size={14} /> Update
              </Link>
            </div>

            {user?.bmi ? (
              <div className="profile-bmi-grid">
                <div className="profile-bmi-item">
                  <span className="profile-bmi-label">BMI</span>
                  <span className="profile-bmi-value" style={{ color: getBMIColor(user.bmi_category) }}>
                    {user.bmi}
                  </span>
                </div>
                <div className="profile-bmi-item">
                  <span className="profile-bmi-label">Category</span>
                  <span className="badge" style={{
                    background: `${getBMIColor(user.bmi_category)}20`,
                    color: getBMIColor(user.bmi_category),
                    fontSize: '0.875rem',
                    padding: '0.375rem 1rem',
                  }}>
                    {user.bmi_category}
                  </span>
                </div>
                <div className="profile-bmi-item">
                  <span className="profile-bmi-label">Height</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user.height_cm} cm</span>
                </div>
                <div className="profile-bmi-item">
                  <span className="profile-bmi-label">Weight</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user.weight_kg} kg</span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No BMI data yet. <Link to="/bmi" style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Calculate now →</Link>
              </p>
            )}
          </div>
          {/* My Goals Card */}
          <div className="glass-card animate-in" style={{ animationDelay: '0.12s', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>
                <Target size={18} style={{ color: 'var(--accent-pink)' }} />
                My Goals
              </h3>
              {!isEditingGoals ? (
                <button onClick={() => setIsEditingGoals(true)} className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                  <Pencil size={14} /> Edit Goals
                </button>
              ) : (
                <button onClick={handleGoalSubmit} className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', background: 'var(--accent-teal)', color: '#000' }}>
                  <Check size={14} /> Save Goals
                </button>
              )}
            </div>

            {goals && !isEditingGoals && (
              <div className="profile-bmi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="profile-bmi-item" style={{ background: 'var(--card-bg-light)' }}>
                  <span className="profile-bmi-label"><Footprints size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Daily Steps</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-teal)' }}>{goals.step_goal.toLocaleString()}</span>
                </div>
                <div className="profile-bmi-item" style={{ background: 'var(--card-bg-light)' }}>
                  <span className="profile-bmi-label"><Moon size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Sleep Target</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{goals.sleep_goal} hrs</span>
                </div>
                <div className="profile-bmi-item" style={{ background: 'var(--card-bg-light)' }}>
                  <span className="profile-bmi-label"><Droplets size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Water Intake</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{goals.water_goal} glasses</span>
                </div>
                <div className="profile-bmi-item" style={{ background: 'var(--card-bg-light)' }}>
                  <span className="profile-bmi-label"><Heart size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Calories Burn Target</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-pink)' }}>{goals.calorie_goal} kcal</span>
                </div>
              </div>
            )}

            {goals && isEditingGoals && (
              <form onSubmit={handleGoalSubmit} className="profile-bmi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="input-group">
                  <label>Daily Steps Goal</label>
                  <input type="number" className="input-field" value={goalForm.step_goal} onChange={e => setGoalForm({ ...goalForm, step_goal: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Sleep Goal (hours)</label>
                  <input type="number" step="0.5" className="input-field" value={goalForm.sleep_goal} onChange={e => setGoalForm({ ...goalForm, sleep_goal: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Water Goal (glasses)</label>
                  <input type="number" className="input-field" value={goalForm.water_goal} onChange={e => setGoalForm({ ...goalForm, water_goal: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Calorie Burn Goal</label>
                  <input type="number" className="input-field" value={goalForm.calorie_goal} onChange={e => setGoalForm({ ...goalForm, calorie_goal: e.target.value })} required />
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Activity Stats */}
        <div className="animate-in" style={{ animationDelay: '0.16s', marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Activity Summary</h3>
          <div className="grid-4 profile-stats-grid">
            {statCards.map(({ label, value, icon: Icon, color, path }) => (
              <Link to={path} key={label} style={{ textDecoration: 'none' }}>
                <div className="glass-card stat-card profile-stat-card">
                  <Icon size={22} style={{ color, marginBottom: '0.5rem' }} />
                  <div className="stat-value" style={{ color, fontSize: '2rem' }}>{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
