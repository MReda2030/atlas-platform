'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEDIA_BUYER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  branchId?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isMediaBuyer: () => boolean
  loading: boolean
}

interface RegisterData {
  email: string
  password: string
  name: string
  role: 'ADMIN' | 'MEDIA_BUYER'
  // branchId removed - media buyers don't get branch assignment
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authKey, setAuthKey] = useState(0) // Help React track auth state changes

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('atlas_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('atlas_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          localStorage.setItem('atlas_user', JSON.stringify(data.user))
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user || user.role !== 'SUPER_ADMIN') {
        return {
          success: false,
          message: 'Super Administrator access required'
        }
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify(user)
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || 'User registered successfully'
        }
      } else {
        return {
          success: false,
          message: data.error || 'Registration failed'
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        message: 'Network error. Please try again.'
      }
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem('atlas_user')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
    setUser(null)
    setAuthKey(prev => prev + 1) // Force re-render with new key
  }

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  }

  const isSuperAdmin = (): boolean => {
    return user?.role === 'SUPER_ADMIN'
  }

  const isMediaBuyer = (): boolean => {
    return user?.role === 'MEDIA_BUYER'
  }

  return (
    <AuthContext.Provider 
      key={authKey} 
      value={{
        user,
        login,
        logout,
        register,
        isAdmin,
        isSuperAdmin,
        isMediaBuyer,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}