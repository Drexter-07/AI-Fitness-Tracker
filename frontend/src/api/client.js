const API_BASE = '/api';

/**
 * Get the current JWT token from localStorage.
 */
function getToken() {
  return localStorage.getItem('fittrack_token');
}

/**
 * Core request function – automatically attaches JWT Authorization header.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach JWT if available (skip for auth endpoints)
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { headers, ...options };
  delete config.skipAuth;

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // ── Auth ──────────────────────────────────────
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  googleAuth: (data) => request('/auth/google', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  getMe: (tokenOverride) => {
    const headers = { 'Content-Type': 'application/json' };
    if (tokenOverride) headers['Authorization'] = `Bearer ${tokenOverride}`;
    return request('/auth/me', { headers, skipAuth: !!tokenOverride });
  },

  // ── BMI ───────────────────────────────────────
  calculateBMI: (data) => request('/bmi/', { method: 'POST', body: JSON.stringify(data) }),

  // ── Sleep ─────────────────────────────────────
  logSleep: (data) => request('/sleep/', { method: 'POST', body: JSON.stringify(data) }),
  getSleepLogs: () => request('/sleep/'),
  analyzeSleep: (data) => request('/sleep/analyze', { method: 'POST', body: JSON.stringify(data) }),

  // ── Steps ─────────────────────────────────────
  logSteps: (data) => request('/steps/', { method: 'POST', body: JSON.stringify(data) }),
  getStepsLogs: () => request('/steps/'),

  // ── Workout ───────────────────────────────────
  logWorkout: (data) => request('/workout/', { method: 'POST', body: JSON.stringify(data) }),
  getWorkoutLogs: () => request('/workout/'),
  analyzeWorkout: (data) => request('/workout/analyze', { method: 'POST', body: JSON.stringify(data) }),

  // ── Water ─────────────────────────────────────
  logWater: (data) => request('/water/', { method: 'POST', body: JSON.stringify(data) }),
  getWaterLogs: () => request('/water/'),

  // ── Energy ────────────────────────────────────
  getEnergyScore: () => request('/energy/'),

  // ── Profile ───────────────────────────────────────
  getProfileStats: () => request('/auth/profile/stats'),

  // ── Dashboard ─────────────────────────────────────
  getDashboardToday: () => request('/dashboard/today'),

  // ── Reports ───────────────────────────────────────
  generateWeeklyReport: () => request('/reports/weekly', { method: 'POST' }),
  getReports: () => request('/reports/'),
  getReport: (id) => request(`/reports/${id}`),

  // ── Goals ─────────────────────────────────────────
  getGoals: () => request('/goals/'),
  updateGoals: (data) => request('/goals/', { method: 'PUT', body: JSON.stringify(data) }),
};
