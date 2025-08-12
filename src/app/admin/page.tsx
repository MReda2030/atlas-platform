import Link from 'next/link'
import { 
  Database, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings,
  Shield,
  Activity,
  Building2,
  Globe,
  MapPin,
  Megaphone,
  ArrowRight,
  BarChart3,
  Clock
} from 'lucide-react'

const adminCards = [
  {
    title: 'Master Data Management',
    description: 'Manage branches, agents, countries, and advertising platforms',
    href: '/admin/master-data',
    icon: Database,
    color: 'blue',
    stats: { branches: 4, agents: 48, countries: 16, platforms: 5 }
  },
  {
    title: 'User Management',
    description: 'Manage users, roles, and permissions',
    href: '/admin/users',
    icon: Users,
    color: 'green',
    stats: { users: 12, admins: 2, mediaBuyers: 10 }
  },
  {
    title: 'Reports Overview',
    description: 'View and manage all media and sales reports',
    href: '/admin/reports',
    icon: FileText,
    color: 'purple',
    stats: { mediaReports: 145, salesReports: 203 }
  },
  {
    title: 'Analytics Dashboard',
    description: 'System-wide analytics and performance metrics',
    href: '/admin/analytics',
    icon: TrendingUp,
    color: 'orange',
    stats: { roi: '245%', conversion: '18.5%' }
  },
  {
    title: 'System Settings',
    description: 'Configure system settings and preferences',
    href: '/admin/settings',
    icon: Settings,
    color: 'gray',
    stats: { lastUpdated: '2 days ago' }
  },
  {
    title: 'Audit Logs',
    description: 'View system activity and audit trails',
    href: '/admin/audit',
    icon: Shield,
    color: 'red',
    stats: { events: 1250, today: 45 }
  }
]

const recentActivity = [
  { action: 'Agent Added', details: 'Agent 49 added to 4 Seasons branch', time: '2 hours ago', type: 'create' },
  { action: 'Platform Updated', details: 'Meta platform marked as active', time: '5 hours ago', type: 'update' },
  { action: 'Report Created', details: 'Media report for UAE submitted', time: '1 day ago', type: 'create' },
  { action: 'User Modified', details: 'buyer@atlas.com permissions updated', time: '2 days ago', type: 'update' },
  { action: 'Country Added', details: 'Georgia added to destinations', time: '3 days ago', type: 'create' }
]

const quickStats = [
  { label: 'Total Revenue', value: '$1.2M', change: '+12%', trend: 'up' },
  { label: 'Active Campaigns', value: '47', change: '+5', trend: 'up' },
  { label: 'Conversion Rate', value: '18.5%', change: '+2.3%', trend: 'up' },
  { label: 'Active Agents', value: '42', change: '-1', trend: 'down' }
]

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                System administration and configuration
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              Last login: Today at 9:00 AM
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminCards.map((card) => {
            const Icon = card.icon
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
              green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
              purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
              orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
              gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
              red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }
            
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {card.description}
                </p>
                
                {/* Stats */}
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  {Object.entries(card.stats).map(([key, value], index) => (
                    <span key={key}>
                      {index > 0 && ' • '}
                      {typeof value === 'number' ? `${value} ${key}` : value}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <span className="text-sm font-medium">Manage</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Recent Activity and Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </h2>
              <Link href="/admin/audit" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.details}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                      activity.type === 'create' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    }`}>
                      {activity.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Overview
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Database Usage</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="font-medium">8/12</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '66%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">API Requests (24h)</span>
                  <span className="font-medium">2,450</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
              
              <div className="pt-4 border-t dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">System Health</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">Optimal</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Last Backup</p>
                    <p className="font-semibold">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}