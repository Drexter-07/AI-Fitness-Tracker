import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('fittrack_token'))
  const [loading, setLoading] = useState(true)

  // On mount: validate existing token
  useEffect(() => {
    if (token) {
      api.getMe(token)
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          // Token invalid/expired → clear
          localStorage.removeItem('fittrack_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await api.login({ email, password })
    localStorage.setItem('fittrack_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password })
    localStorage.setItem('fittrack_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const googleLogin = async (googleToken) => {
    const data = await api.googleAuth({ token: googleToken })
    localStorage.setItem('fittrack_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('fittrack_token')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    if (token) {
      try {
        const userData = await api.getMe(token)
        setUser(userData)
      } catch {
        // ignore
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user && !!token,
      login,
      register,
      googleLogin,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
