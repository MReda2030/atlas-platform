'use client';

import { lazy, Suspense } from 'react';

// Lazy load the heavy FilterPanel component
const FilterPanel = lazy(() => 
  import('../../app/admin/analytics/components/FilterPanel').then(module => ({
    default: module.FilterPanel
  }))
);

// Loading skeleton for FilterPanel
const FilterPanelSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-blue-200 rounded"></div>
    </div>
  </div>
);

// Wrapper component with Suspense
export const LazyFilterPanel = (props: any) => (
  <Suspense fallback={<FilterPanelSkeleton />}>
    <FilterPanel {...props} />
  </Suspense>
);

export default LazyFilterPanel;