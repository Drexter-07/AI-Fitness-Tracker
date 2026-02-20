import { Link, useLocation } from 'react-router-dom'
import { Activity, Moon, Footprints, Dumbbell, Droplets, Zap, Home } from 'lucide-react'

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/sleep', label: 'Sleep', icon: Moon },
  { path: '/steps', label: 'Steps', icon: Footprints },
  { path: '/workout', label: 'Workout', icon: Dumbbell },
  { path: '/water', label: 'Water', icon: Droplets },
  { path: '/energy', label: 'Energy', icon: Zap },
]

export default function Navbar() {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const userId = localStorage.getItem('fittrack_user_id')

  if (isLanding) return null

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <Activity size={24} style={{ color: 'var(--accent-teal)' }} />
          <span className="gradient-text" style={styles.logoText}>FitTrack AI</span>
        </Link>

        <div style={styles.links}>
          {userId && navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              style={{
                ...styles.link,
                ...(location.pathname === path ? styles.linkActive : {}),
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {userId && (
          <div style={styles.userBadge}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>User</span>
            <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>#{userId}</span>
          </div>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(10, 14, 23, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border-glass)',
    height: '72px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 800,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  linkActive: {
    color: 'var(--accent-teal)',
    background: 'rgba(45, 212, 191, 0.1)',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    fontSize: '0.8125rem',
  },
}
