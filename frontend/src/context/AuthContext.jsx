import { createContext, useContext, useState } from 'react'
import { loginRequest, registerRequest } from '../api/auth'

const AuthContext = createContext(null)

const TOKEN_KEY = 'campusfind_token'
const USER_KEY = 'campusfind_user'

/**
 * Authentication provider component managing global user identity and JWT state.
 */
export function AuthProvider({ children }) {
  // In development, seed Rohit Mehta session if localStorage is clear so dev preview is immediately active
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    if (!localStorage.getItem(USER_KEY) && !sessionStorage.getItem('cf_logged_out')) {
      localStorage.setItem(USER_KEY, JSON.stringify({ id: 9, name: 'Rohit Mehta', email: 'rohitmehtaddn@gmail.com', role: 'STUDENT' }))
      localStorage.setItem(TOKEN_KEY, 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5IiwidXNlcklkIjo5LCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTc5MzQ3NTkzMywiZXhwIjoxNzkzNTYyMzMzfQ.5yShWp9kTzYngrugCrLblMU_HJQr1vNWAJWafGg4PEg')
    }
  }

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch {
        return null
      }
    }
    return null
  })

  /**
   * Authenticates user credentials, stores token and user in state and localStorage.
   */
  const login = async (email, password) => {
    const data = await loginRequest(email, password)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cf_logged_out')
    }
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data
  }

  /**
   * Registers a new user. Does not automatically log in inside AuthContext
   * to keep AuthContext methods atomic and single-purpose.
   */
  const register = async (name, email, password) => {
    return await registerRequest(name, email, password)
  }

  /**
   * Clears authenticated session from state and localStorage.
   */
  const logout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cf_logged_out', '1')
    }
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to access authentication context.
 * Throws an error if invoked outside an AuthProvider.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
