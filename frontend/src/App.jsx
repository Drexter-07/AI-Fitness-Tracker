import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SleepTracker from './pages/SleepTracker'
import StepsTracker from './pages/StepsTracker'
import WorkoutTracker from './pages/WorkoutTracker'
import WaterFitness from './pages/WaterFitness'
import EnergyScore from './pages/EnergyScore'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sleep" element={<SleepTracker />} />
        <Route path="/steps" element={<StepsTracker />} />
        <Route path="/workout" element={<WorkoutTracker />} />
        <Route path="/water" element={<WaterFitness />} />
        <Route path="/energy" element={<EnergyScore />} />
      </Routes>
    </>
  )
}

export default App
