import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

/**
 * Dispatch a custom event so page components can refresh their data
 * after the AI performs a global action.
 */
function notifyPageRefresh(actionName) {
  window.dispatchEvent(new CustomEvent('copilot-action', { detail: { action: actionName } }))
}

/**
 * Global CopilotKit actions — registered at the App level so the AI
 * can perform any fitness-tracking action regardless of which page
 * the user is currently on.
 */
export default function useGlobalCopilotActions() {
  const { user, isAuthenticated, refreshUser } = useAuth()

  // ── Readable: user profile ──
  useCopilotReadable({
    description: "Current user's profile: name, email, BMI value, and BMI category",
    value: user
      ? { name: user.name, email: user.email, bmi: user.bmi, bmiCategory: user.bmi_category }
      : { note: 'User not logged in' },
  })

  // ── Readable: current date ──
  // This ensures the AI knows the real current date instead of guessing
  // from its training data cutoff.
  useCopilotReadable({
    description: "The real current date today. ALWAYS use this as the default date for any logging action, never guess or hallucinate a date.",
    value: { today: new Date().toISOString().split('T')[0] },
  })

  // ── Action: Log sleep ──
  useCopilotAction({
    name: 'logSleep',
    description: 'Log a sleep entry to the database for the user.',
    parameters: [
      { name: 'sleep_time', type: 'string', description: "Time the user went to sleep, e.g. '10:00 PM'", required: true },
      { name: 'wake_time', type: 'string', description: "Time the user woke up, e.g. '6:00 AM'", required: true },
    ],
    handler: async ({ sleep_time, wake_time }) => {
      if (!isAuthenticated) return 'Error: Please log in first.'
      try {
        await api.logSleep({ sleep_time, wake_time })
        notifyPageRefresh('logSleep')
        return `Successfully logged sleep: ${sleep_time} → ${wake_time}`
      } catch (err) {
        return `Error logging sleep: ${err.message}`
      }
    },
  })

  // ── Action: Log steps ──
  useCopilotAction({
    name: 'logSteps',
    description: 'Log a step count entry to the database for the user. Do NOT provide a date unless the user explicitly mentions a specific date — the system auto-fills today.',
    parameters: [
      { name: 'steps', type: 'number', description: 'Number of steps walked', required: true },
      { name: 'date', type: 'string', description: 'ONLY provide this if the user explicitly says a specific date (e.g. "yesterday", "2026-02-20"). Leave empty/omit to automatically use today.', required: false },
    ],
    handler: async ({ steps, date }) => {
      if (!isAuthenticated) return 'Error: Please log in first.'
      try {
        const logDate = date || new Date().toISOString().split('T')[0]
        await api.logSteps({ steps, date: logDate })
        notifyPageRefresh('logSteps')
        return `Successfully logged ${steps.toLocaleString()} steps for ${logDate}`
      } catch (err) {
        return `Error logging steps: ${err.message}`
      }
    },
  })

  // ── Action: Log workout ──
  useCopilotAction({
    name: 'logWorkout',
    description: 'Log a workout entry to the database for the user.',
    parameters: [
      { name: 'workout_type', type: 'string', description: 'Type of workout: walking, running, strength, or misc', required: true },
      { name: 'duration_min', type: 'number', description: 'Duration of the workout in minutes', required: true },
      { name: 'intensity', type: 'string', description: 'Workout intensity: low, moderate, or high', required: true },
      { name: 'notes', type: 'string', description: 'Optional notes about the workout', required: false },
    ],
    handler: async ({ workout_type, duration_min, intensity, notes }) => {
      if (!isAuthenticated) return 'Error: Please log in first.'
      try {
        await api.logWorkout({ workout_type, duration_min, intensity, notes: notes || '' })
        notifyPageRefresh('logWorkout')
        return `Successfully logged ${duration_min} min ${intensity} ${workout_type} workout`
      } catch (err) {
        return `Error logging workout: ${err.message}`
      }
    },
  })

  // ── Action: Log water intake ──
  useCopilotAction({
    name: 'logWater',
    description: 'Log water intake to the database for the user. Do NOT provide a date unless the user explicitly mentions a specific date — the system auto-fills today.',
    parameters: [
      { name: 'glasses', type: 'number', description: 'Number of glasses of water (each ~250ml)', required: true },
      { name: 'date', type: 'string', description: 'ONLY provide this if the user explicitly says a specific date. Leave empty/omit to automatically use today.', required: false },
    ],
    handler: async ({ glasses, date }) => {
      if (!isAuthenticated) return 'Error: Please log in first.'
      try {
        const logDate = date || new Date().toISOString().split('T')[0]
        await api.logWater({ glasses, date: logDate })
        notifyPageRefresh('logWater')
        return `Successfully logged ${glasses} glasses of water for ${logDate}`
      } catch (err) {
        return `Error logging water: ${err.message}`
      }
    },
  })

  // ── Action: Get energy score ──
  useCopilotAction({
    name: 'getEnergyScore',
    description: 'Fetch the energy score for the user.',
    parameters: [],
    handler: async () => {
      if (!isAuthenticated) return 'Error: Please log in first.'
      try {
        const data = await api.getEnergyScore()
        return `Energy score: ${data.score}/100 (Sleep: ${data.sleep_factor}, Workout: ${data.workout_factor})`
      } catch (err) {
        return `Error fetching energy score: ${err.message}`
      }
    },
  })

  // ── Action: Calculate BMI ──
  useCopilotAction({
    name: 'calculateBMI',
    description: 'Calculate BMI for the user given height in cm and weight in kg.',
    parameters: [
      { name: 'height_cm', type: 'number', description: 'Height in centimeters', required: true },
      { name: 'weight_kg', type: 'number', description: 'Weight in kilograms', required: true },
    ],
    handler: async ({ height_cm, weight_kg }) => {
      if (!isAuthenticated) return 'Error: Please log in first.'
      try {
        const data = await api.calculateBMI({ height_cm, weight_kg })
        await refreshUser()
        notifyPageRefresh('calculateBMI')
        return `BMI calculated: ${data.bmi} (${data.bmi_category})`
      } catch (err) {
        return `Error calculating BMI: ${err.message}`
      }
    },
  })

  // ── Action: Update Goals ──
  useCopilotAction({
    name: 'updateGoals',
    description: 'Update the user\'s daily fitness goals (steps, sleep, water, calories). Only provide the fields the user explicitly wants to change.',
    parameters: [
      { name: 'step_goal', type: 'number', description: 'Daily steps goal (e.g. 15000)', required: false },
      { name: 'sleep_goal', type: 'number', description: 'Daily sleep goal in hours (e.g. 8)', required: false },
      { name: 'water_goal', type: 'number', description: 'Daily water goal in glasses (e.g. 10)', required: false },
      { name: 'calorie_goal', type: 'number', description: 'Daily calories burn goal (e.g. 3000)', required: false },
    ],
    handler: async (args) => {
      if (!isAuthenticated) return 'Error: Please log in first.'
      
      // Filter out undefined arguments
      const updateData = Object.fromEntries(
        Object.entries(args).filter(([_, v]) => v !== undefined && v !== null)
      )
      
      if (Object.keys(updateData).length === 0) {
        return 'No valid goals provided to update.'
      }

      try {
        await api.updateGoals(updateData)
        notifyPageRefresh('updateGoals')
        return `Successfully updated goals: ${JSON.stringify(updateData)}`
      } catch (err) {
        return `Error updating goals: ${err.message}`
      }
    },
  })
}
