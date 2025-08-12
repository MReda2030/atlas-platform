import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  branchId?: string
}

export async function getServerAuth(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')
    
    if (!token) return null
    
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as any
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      branchId: decoded.branchId
    }
  } catch (error) {
    return null
  }
}

export function isAuthenticated(user: AuthUser | null): boolean {
  return user !== null
}

export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}