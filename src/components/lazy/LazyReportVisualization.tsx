'use client';

import { lazy, Suspense } from 'react';

// Lazy load the heavy ReportVisualization component
const ReportVisualization = lazy(() => 
  import('../../app/admin/analytics/components/ReportVisualization').then(module => ({
    default: module.ReportVisualization
  }))
);

// Loading skeleton for ReportVisualization
const ReportVisualizationSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      {/* Chart skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded mb-4"></div>
        
        {/* Metrics skeleton */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="h-4 bg-gray-200 rounded w-1/5 mb-4"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Wrapper component with Suspense
export const LazyReportVisualization = (props: any) => (
  <Suspense fallback={<ReportVisualizationSkeleton />}>
    <ReportVisualization {...props} />
  </Suspense>
);

export default LazyReportVisualization;