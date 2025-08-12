import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/media',
  '/sales',
  '/analytics',
  '/admin'
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/auth/register'
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for static assets and API routes
  if (pathname.includes('_next') || pathname.includes('/api/')) {
    return NextResponse.next()
  }
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // Check for authentication token (prioritize auth-token over atlas_user)
  const authToken = request.cookies.get('auth-token')
  const userCookie = request.cookies.get('atlas_user')
  
  // If no authentication found, redirect to login
  if (!authToken && !userCookie) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // For admin routes, check if user has admin role
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  if (isAdminRoute && userCookie) {
    try {
      const userData = JSON.parse(userCookie.value)
      if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      // If cookie is malformed, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api routes (handled separately)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public files (public folder)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}