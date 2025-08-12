'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  adminOnly?: boolean
  superAdminOnly?: boolean
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  adminOnly = false,
  superAdminOnly = false
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && requireAuth) {
      if (!user) {
        router.replace('/auth/login')
      } else if (superAdminOnly && user.role !== 'SUPER_ADMIN') {
        router.replace('/dashboard')
      } else if (adminOnly && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        router.replace('/dashboard')
      }
    }
  }, [user, loading, requireAuth, adminOnly, superAdminOnly, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5750F1] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to access this page.
          </p>
          <Button onClick={() => router.push('/auth/login')} className="bg-[#5750F1] hover:bg-[#4338CA]">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (user && superAdminOnly && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Super Admin Access Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Only Super Administrators can access this feature.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-[#5750F1] hover:bg-[#4338CA]"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (user && adminOnly && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Access Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need administrator privileges to access this area.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-[#5750F1] hover:bg-[#4338CA]"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}