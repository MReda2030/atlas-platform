'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Building2, 
  Users, 
  Globe, 
  MapPin, 
  Megaphone,
  Database,
  ChevronRight
} from 'lucide-react'

const masterDataItems = [
  {
    name: 'Branches',
    href: '/admin/master-data/branches',
    icon: Building2,
    description: 'Manage business branches and locations'
  },
  {
    name: 'Sales Agents',
    href: '/admin/master-data/agents',
    icon: Users,
    description: 'Manage sales agents and assignments'
  },
  {
    name: 'Target Countries',
    href: '/admin/master-data/target-countries',
    icon: Globe,
    description: 'Manage Gulf target countries'
  },
  {
    name: 'Destinations',
    href: '/admin/master-data/destinations',
    icon: MapPin,
    description: 'Manage travel destination countries'
  },
  {
    name: 'Ad Platforms',
    href: '/admin/master-data/platforms',
    icon: Megaphone,
    description: 'Manage advertising platforms'
  }
]

export default function MasterDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Master Data
              </h1>
            </div>
            
            <nav className="space-y-1">
              {masterDataItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}