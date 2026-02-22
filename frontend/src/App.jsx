import { Routes, Route, Navigate } from 'react-router-dom'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import BMIPage from './pages/BMIPage'
import SleepTracker from './pages/SleepTracker'
import StepsTracker from './pages/StepsTracker'
import WorkoutTracker from './pages/WorkoutTracker'
import WaterFitness from './pages/WaterFitness'
import EnergyScore from './pages/EnergyScore'
import ProfilePage from './pages/ProfilePage'
import ReportsPage from './pages/ReportsPage'
import useGlobalCopilotActions from './hooks/useGlobalCopilotActions'
import { useTheme } from './hooks/useTheme'

/** Protected route wrapper */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: '6rem' }}>Loading...</div>
  return isAuthenticated ? children : <Navigate to="/login" />
}

/** Redirect new users (no BMI) to the BMI setup page */
function BMIGate({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user && !user.bmi) return <Navigate to="/bmi" />
  return children
}

/** Public route wrapper — redirects to dashboard if already logged in */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Navigate to="/dashboard" /> : children
}

function App() {
  const { isAuthenticated } = useAuth()
  useTheme()

  // Register global CopilotKit actions only when authenticated
  useGlobalCopilotActions()

  return (
    <>
      {isAuthenticated && <Navbar />}
      {isAuthenticated ? (
        <CopilotSidebar
          labels={{
            title: "FitTrack AI Assistant",
            initial: "Hi! 👋 I'm your FitTrack AI assistant. Ask me anything about your sleep, workouts, steps, water intake, or energy score!",
            placeholder: "Ask about your fitness data…",
          }}
          defaultOpen={false}
          clickOutsideToClose={true}
        >
          <Routes>
            <Route path="/" element={<ProtectedRoute><BMIGate><Landing /></BMIGate></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><BMIGate><Dashboard /></BMIGate></ProtectedRoute>} />
            <Route path="/bmi" element={<ProtectedRoute><BMIPage /></ProtectedRoute>} />
            <Route path="/sleep" element={<ProtectedRoute><BMIGate><SleepTracker /></BMIGate></ProtectedRoute>} />
            <Route path="/steps" element={<ProtectedRoute><BMIGate><StepsTracker /></BMIGate></ProtectedRoute>} />
            <Route path="/workout" element={<ProtectedRoute><BMIGate><WorkoutTracker /></BMIGate></ProtectedRoute>} />
            <Route path="/water" element={<ProtectedRoute><BMIGate><WaterFitness /></BMIGate></ProtectedRoute>} />
            <Route path="/energy" element={<ProtectedRoute><BMIGate><EnergyScore /></BMIGate></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><BMIGate><ProfilePage /></BMIGate></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><BMIGate><ReportsPage /></BMIGate></ProtectedRoute>} />
            <Route path="/login" element={<Navigate to="/dashboard" />} />
            <Route path="/register" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </CopilotSidebar>
      ) : (
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  )
}

export default App
