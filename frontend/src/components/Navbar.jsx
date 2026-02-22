import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Moon, Sun, Footprints, Dumbbell, Droplets, Zap, Home, Heart, LogOut, User, FileText, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/bmi', label: 'BMI', icon: Heart },
  { path: '/sleep', label: 'Sleep', icon: Moon },
  { path: '/steps', label: 'Steps', icon: Footprints },
  { path: '/workout', label: 'Workout', icon: Dumbbell },
  { path: '/water', label: 'Water', icon: Droplets },
  { path: '/energy', label: 'Energy', icon: Zap },
  { path: '/reports', label: 'Reports', icon: FileText },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isLanding = location.pathname === '/'

  if (isLanding) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/dashboard" style={styles.logo}>
          <Activity size={24} style={{ color: 'var(--accent-teal)' }} />
          <span className="gradient-text" style={styles.logoText}>FitTrack AI</span>
        </Link>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <div style={styles.userSection}>
          <button onClick={toggleTheme} style={styles.iconBtn} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <Link to="/profile" style={styles.userBadge} title="View profile">
              <User size={14} style={{ color: 'var(--accent-teal)' }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>
                <span>{user.name?.split(' ')[0]}</span>
                {user.name?.includes(' ') && (
                  <span className="nav-last-name">
                    {' ' + user.name.split(' ').slice(1).join(' ')}
                  </span>
                )}
              </span>
            </Link>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            <LogOut size={16} />
          </button>
          <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} title="Menu">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'var(--nav-bg)',
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
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.4rem',
    borderRadius: '8px',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
}
