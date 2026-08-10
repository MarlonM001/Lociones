import { createContext, useEffect, useState } from 'react'
import { ensureAdminSeed, getSession, loginUser, logoutUser, registerUser } from '@/services/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession)

  useEffect(() => {
    ensureAdminSeed()
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
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
