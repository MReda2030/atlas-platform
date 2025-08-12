import Link from 'next/link'
import { 
  Building2, 
  Users, 
  Globe, 
  MapPin, 
  Megaphone,
  ArrowRight,
  Database,
  Shield,
  Activity
} from 'lucide-react'

const stats = [
  { name: 'Active Branches', value: '4', icon: Building2 },
  { name: 'Sales Agents', value: '48', icon: Users },
  { name: 'Target Countries', value: '6', icon: Globe },
  { name: 'Destinations', value: '10', icon: MapPin },
]

const masterDataCards = [
  {
    title: 'Branches',
    description: 'Manage business branches like 4 Seasons, Amazonn, Fantastic, and Skyline',
    href: '/admin/master-data/branches',
    icon: Building2,
    color: 'blue',
    count: 4
  },
  {
    title: 'Sales Agents',
    description: 'Manage sales agents across all branches with assignments and status',
    href: '/admin/master-data/agents',
    icon: Users,
    color: 'green',
    count: 48
  },
  {
    title: 'Target Countries',
    description: 'Configure Gulf countries where marketing campaigns are targeted',
    href: '/admin/master-data/target-countries',
    icon: Globe,
    color: 'purple',
    count: 6
  },
  {
    title: 'Destination Countries',
    description: 'Manage travel destinations like Armenia, Turkey, Bosnia, etc.',
    href: '/admin/master-data/destinations',
    icon: MapPin,
    color: 'orange',
    count: 10
  },
  {
    title: 'Advertising Platforms',
    description: 'Configure advertising platforms like Meta, Google, TikTok, Snapchat',
    href: '/admin/master-data/platforms',
    icon: Megaphone,
    color: 'pink',
    count: 5
  }
]

export default function MasterDataDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              Master Data Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage core business data including branches, agents, countries, and platforms
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Admin Access</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Master Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masterDataCards.map((card) => {
          const Icon = card.icon
          const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
            green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
            orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
            pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400',
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
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.count}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {card.description}
              </p>
              
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <span className="text-sm font-medium">Manage</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New agent added: Agent 49
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Branch: 4 Seasons • 2 hours ago
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
              Added
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Platform updated: Meta
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Status changed to active • 5 hours ago
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
              Updated
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Branch modified: Amazonn
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Code changed • 1 day ago
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
              Modified
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}