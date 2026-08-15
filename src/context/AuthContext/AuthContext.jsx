import { createContext, useEffect, useState } from 'react'
import { getSession, loginUser, logoutUser, registerUser } from '@/services/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    getSession()
      .then(setUser)
      .finally(() => setInitializing(false))
  }, [])

  const login = async (credentials) => {
    const loggedInUser = await loginUser(credentials)
    setUser(loggedInUser)
    return loggedInUser
  }

  const register = async (data) => {
    const newUser = await registerUser(data)
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    logoutUser()
    setUser(null)
  }

  const value = {
    user,
    initializing,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
