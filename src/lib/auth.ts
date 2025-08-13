import { NextRequest } from 'next/server'
import { User } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/auth/roles-permissions'

export function getUserFromRequest(request: NextRequest): User | null {
  try {
    // In a real app, this would validate a JWT token from the Authorization header
    // For now, we'll simulate it by checking if the user exists in the header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    // Simulate JWT validation - in reality, you'd decode and verify the JWT
    const userData = request.headers.get('x-user-data')
    if (!userData) return null

    return JSON.parse(userData) as User
  } catch (error) {
    return null
  }
}

export function requireAdmin(request: NextRequest): { user: User } | { error: string } {
  const user = getUserFromRequest(request)
  
  if (!user) {
    return { error: 'Authentication required' }
  }
  
  if (user.role !== UserRole.ADMIN) {
    return { error: 'Admin access required' }
  }
  
  return { user }
}

export function requireAuth(request: NextRequest): { user: User } | { error: string } {
  const user = getUserFromRequest(request)
  
  if (!user) {
    return { error: 'Authentication required' }
  }
  
  return { user }
}

// For client-side use - check localStorage
export function getClientUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const storedUser = localStorage.getItem('atlas_user')
    if (storedUser) {
      return JSON.parse(storedUser)
    }
    return null
  } catch (error) {
    return null
  }
}

export function isClientAdmin(): boolean {
  const user = getClientUser()
  return user?.role === UserRole.ADMIN
}