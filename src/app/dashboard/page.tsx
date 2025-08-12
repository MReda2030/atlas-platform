'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { navigationCache } from '@/lib/navigation-cache';
// Lazy load performance monitor for better initial page load
const PerformanceMonitor = lazy(() => import('@/components/performance/PerformanceMonitor').then(mod => ({ default: mod.PerformanceMonitor })));

interface DashboardStats {
  totalSpend: { value: number; change: number }
  totalDeals: { value: number; change: number }
  conversionRate: { value: number; change: number }
  roi: { value: number; change: number }
  topPerformers: {
    agent: { name: string; deals: number }
    country: { name: string; conversionRate: number }
    platform: { name: string; cpa: number }
  }
}

interface RecentActivity {
  id: string
  type: 'media_report' | 'sales_report'
  title: string
  description: string
  date: string
  branch: string
  amount?: number
  deals?: number
}

export default function DashboardPage() {
  const { user, isSuperAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Memoize expensive computations
  const isUserSuperAdmin = useMemo(() => isSuperAdmin(), [isSuperAdmin]);
  
  // API endpoints
  const apiEndpoints = useMemo(() => {
    return {
      stats: '/api/dashboard/stats',
      activity: '/api/dashboard/recent-activity'
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Try to get cached data first
        const cachedStats = navigationCache.get<{ data: DashboardStats }>('dashboard-stats');
        const cachedActivity = navigationCache.get<{ data: RecentActivity[] }>('dashboard-activity');
        
        if (cachedStats && cachedActivity) {
          setStats(cachedStats.data);
          setRecentActivity(cachedActivity.data);
          setLoading(false);
          return;
        }
        
        // Use parallel fetching with performance-optimized endpoints
        const [statsResponse, activityResponse] = await Promise.all([
          fetch(apiEndpoints.stats, {
            headers: {
              'Cache-Control': 'max-age=300',
            }
          }),
          fetch(apiEndpoints.activity, {
            headers: {
              'Cache-Control': 'max-age=180',
            }
          })
        ])

        const statsData = await statsResponse.json()
        const activityData = await activityResponse.json()

        if (statsData.success) {
          setStats(statsData.data)
          // Cache the data for future navigation
          navigationCache.set('dashboard-stats', statsData, 5 * 60 * 1000); // 5 minutes
        } else {
          setError('Failed to load statistics')
        }

        if (activityData.success) {
          setRecentActivity(activityData.data)
          // Cache the data for future navigation
          navigationCache.set('dashboard-activity', activityData, 5 * 60 * 1000); // 5 minutes
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [apiEndpoints])

  // Memoize expensive formatting functions
  const formatChange = useMemo(() => (change: number) => {
    const prefix = change > 0 ? '+' : ''
    return `${prefix}${change}%`
  }, []);

  const getChangeColor = useMemo(() => (change: number) => {
    return change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <DashboardLayout>
        <div className="p-8">
        <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Performance overview and recent activity
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/media/new">New Media Report</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sales/new">New Sales Report</Link>
            </Button>
            {isSuperAdmin() && (
              <Button asChild variant="secondary">
                <Link href="/auth/register">Register User</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.totalSpend.value.toLocaleString() || '0'}
              </div>
              <p className={`text-xs ${getChangeColor(stats?.totalSpend.change || 0)}`}>
                {formatChange(stats?.totalSpend.change || 0)} from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <span className="text-2xl">🎯</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalDeals.value || 0}</div>
              <p className={`text-xs ${getChangeColor(stats?.totalDeals.change || 0)}`}>
                {formatChange(stats?.totalDeals.change || 0)} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <span className="text-2xl">📈</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conversionRate.value || 0}%</div>
              <p className={`text-xs ${getChangeColor(stats?.conversionRate.change || 0)}`}>
                {formatChange(stats?.conversionRate.change || 0)} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <span className="text-2xl">💹</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.roi.value || 0}%</div>
              <p className={`text-xs ${getChangeColor(stats?.roi.change || 0)}`}>
                {formatChange(stats?.roi.change || 0)} from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performer</CardTitle>
              <CardDescription>Best performing sales agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.topPerformers.agent.name || 'No data'}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats?.topPerformers.agent.deals || 0} deals closed this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Country</CardTitle>
              <CardDescription>Highest converting market</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.topPerformers.country.name || 'No data'}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats?.topPerformers.country.conversionRate || 0}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Platform</CardTitle>
              <CardDescription>Best performing ad platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats?.topPerformers.platform.name || 'No data'}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ${stats?.topPerformers.platform.cpa || 0} cost per acquisition
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest reports and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No recent activity found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Reports will appear here once data is entered
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'media_report' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {activity.branch}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 md:grid-cols-2 ${isSuperAdmin() ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
              <Button asChild variant="outline" className="h-16">
                <Link href="/media" className="flex flex-col items-center gap-2">
                  <span className="text-xl">📊</span>
                  <span>Media Reports</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16">
                <Link href="/sales" className="flex flex-col items-center gap-2">
                  <span className="text-xl">💼</span>
                  <span>Sales Reports</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16">
                <Link href="/analytics" className="flex flex-col items-center gap-2">
                  <span className="text-xl">📈</span>
                  <span>Analytics</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16">
                <Link href="/agents" className="flex flex-col items-center gap-2">
                  <span className="text-xl">👥</span>
                  <span>Agents</span>
                </Link>
              </Button>
              {isSuperAdmin() && (
                <Button asChild variant="outline" className="h-16">
                  <Link href="/auth/register" className="flex flex-col items-center gap-2">
                    <span className="text-xl">👤</span>
                    <span>Register User</span>
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Monitoring Section - Only for Super Admins */}
        {isSuperAdmin() && (
          <div className="mt-8">
            <PerformanceMonitor />
          </div>
        )}
        </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}