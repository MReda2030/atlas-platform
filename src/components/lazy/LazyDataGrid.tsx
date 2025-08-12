'use client';

import { lazy, Suspense } from 'react';

// Lazy load the heavy DataGrid component
const DataGrid = lazy(() => 
  import('../ui/data-grid').then(module => ({
    default: module.default
  }))
);

// Loading skeleton for DataGrid
const DataGridSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="p-6 border-b">
      <div className="flex justify-between items-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-48"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-blue-200 rounded w-24"></div>
        </div>
      </div>
    </div>
    
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        {/* Search bar skeleton */}
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        
        {/* Table header skeleton */}
        <div className="grid grid-cols-5 gap-4 py-3 border-b">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
        
        {/* Table rows skeleton */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 py-3">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Wrapper component with Suspense
export const LazyDataGrid = (props: any) => (
  <Suspense fallback={<DataGridSkeleton />}>
    <DataGrid {...props} />
  </Suspense>
);

export default LazyDataGrid;