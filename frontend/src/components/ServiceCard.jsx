import { Link } from 'react-router-dom'

export default function ServiceCard({ title, description, icon: Icon, path, gradient, color }) {
  return (
    <Link to={path} style={{ textDecoration: 'none' }}>
      <div className="glass-card" style={{ ...styles.card, background: gradient }}>
        <div style={{ ...styles.iconWrap, background: `${color}15`, color }}>
          <Icon size={28} />
        </div>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.desc}>{description}</p>
        <div style={styles.arrow}>→</div>
      </div>
    </Link>
  )
}

const styles = {
  card: {
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  iconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  desc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    flex: 1,
  },
  arrow: {
    fontSize: '1.25rem',
    color: 'var(--text-muted)',
    alignSelf: 'flex-end',
    transition: 'transform 0.2s ease',
  },
}
