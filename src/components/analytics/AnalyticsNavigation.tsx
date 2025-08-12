'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const analyticsPages = [
  {
    name: 'Agent ROI',
    href: '/analytics/agent-roi',
    icon: '👤',
    description: 'Performance by agent'
  },
  {
    name: 'Platforms',
    href: '/analytics/platforms',
    icon: '📱',
    description: 'Ad platform analysis'
  },
  {
    name: 'Destinations',
    href: '/analytics/destinations',
    icon: '🌍',
    description: 'Travel destination trends'
  },
  {
    name: 'Branches',
    href: '/analytics/branches',
    icon: '🏢',
    description: 'Office comparison'
  },
  {
    name: 'ROI Matrix',
    href: '/analytics/roi-matrix',
    icon: '📊',
    description: 'Complete breakdown'
  }
];

export function AnalyticsNavigation() {
  const pathname = usePathname();

  return (
    <Card className="mb-8">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Navigate between different analytics views
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-blue-600">Analytics</span> / 
            <span className="ml-1">
              {analyticsPages.find(page => page.href === pathname)?.name || 'Overview'}
            </span>
          </div>
        </div>
        
        <div className="grid gap-2 md:grid-cols-5">
          {analyticsPages.map((page) => {
            const isActive = pathname === page.href;
            return (
              <Link key={page.href} href={page.href}>
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center w-full hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl mb-1">{page.icon}</span>
                  <span className="font-semibold text-sm">{page.name}</span>
                  <span className="text-xs opacity-70 text-center leading-tight">
                    {page.description}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}