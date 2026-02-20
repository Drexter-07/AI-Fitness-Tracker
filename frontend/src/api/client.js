const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // BMI
  calculateBMI: (data) => request('/bmi/', { method: 'POST', body: JSON.stringify(data) }),

  // Sleep
  logSleep: (data) => request('/sleep/', { method: 'POST', body: JSON.stringify(data) }),
  getSleepLogs: (userId) => request(`/sleep/${userId}`),
  analyzeSleep: (data) => request('/sleep/analyze', { method: 'POST', body: JSON.stringify(data) }),

  // Steps
  logSteps: (data) => request('/steps/', { method: 'POST', body: JSON.stringify(data) }),
  getStepsLogs: (userId) => request(`/steps/${userId}`),

  // Workout
  logWorkout: (data) => request('/workout/', { method: 'POST', body: JSON.stringify(data) }),
  getWorkoutLogs: (userId) => request(`/workout/${userId}`),
  analyzeWorkout: (data) => request('/workout/analyze', { method: 'POST', body: JSON.stringify(data) }),

  // Water & Fitness Suggestions
  logWater: (data) => request('/water/', { method: 'POST', body: JSON.stringify(data) }),
  getWaterLogs: (userId) => request(`/water/${userId}`),
  getFitnessSuggestions: (userId) => request(`/water/suggestions/${userId}`),

  // Energy
  getEnergyScore: (userId) => request(`/energy/${userId}`),
};
