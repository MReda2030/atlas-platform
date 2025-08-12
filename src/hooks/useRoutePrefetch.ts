import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { prefetchMasterData } from '@/lib/query-client';

// Routes that should be prefetched
const PREFETCH_ROUTES = [
  '/analytics/agent-roi',
  '/analytics/platforms', 
  '/analytics/destinations',
  '/analytics/branches',
  '/analytics/roi-matrix',
  '/admin/analytics',
  '/media',
  '/dashboard'
];

export function useRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch critical routes on component mount
    const prefetchRoutes = () => {
      PREFETCH_ROUTES.forEach(route => {
        router.prefetch(route);
      });
    };

    // Prefetch after a short delay to not block initial render
    const timer = setTimeout(prefetchRoutes, 100);

    // Prefetch master data
    prefetchMasterData();

    return () => clearTimeout(timer);
  }, [router]);

  // Function to manually prefetch specific routes
  const prefetchRoute = (route: string) => {
    router.prefetch(route);
  };

  return { prefetchRoute };
}

// Hook for analytics navigation optimization
export function useAnalyticsNavigation() {
  const router = useRouter();

  const navigateToAnalytics = (reportType: string, preserveFilters = true) => {
    let route = '';
    
    switch (reportType) {
      case 'agent_roi':
        route = '/analytics/agent-roi';
        break;
      case 'platform_effectiveness':
        route = '/analytics/platforms';
        break;
      case 'destination_analysis':
        route = '/analytics/destinations';
        break;
      case 'branch_comparison':
        route = '/analytics/branches';
        break;
      case 'roi_matrix':
        route = '/analytics/roi-matrix';
        break;
      default:
        route = '/analytics/agent-roi';
    }

    // Use shallow routing to preserve client state if needed
    if (preserveFilters) {
      // Store current filters in sessionStorage for persistence
      const currentFilters = sessionStorage.getItem('analytics-filters');
      if (currentFilters) {
        sessionStorage.setItem('analytics-filters-backup', currentFilters);
      }
    }

    router.push(route);
  };

  return { navigateToAnalytics };
}