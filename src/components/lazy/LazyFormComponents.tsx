'use client';

import { lazy, Suspense } from 'react';

// Lazy load heavy form components
const MediaReportForm = lazy(() => 
  import('../forms/media-report-form').then(module => ({
    default: module.default
  }))
);

const SalesReportForm = lazy(() => 
  import('../forms/sales-report-form').then(module => ({
    default: module.default
  }))
);

// Loading skeleton for forms
const FormSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      </div>

      {/* Progress indicator skeleton */}
      <div className="flex items-center justify-center space-x-4 py-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
            {i < 3 && <div className="w-16 h-1 bg-gray-200 mx-2"></div>}
          </div>
        ))}
      </div>

      {/* Form fields skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-between">
        <div className="h-10 bg-gray-200 rounded w-20"></div>
        <div className="flex space-x-3">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-blue-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  </div>
);

// Optimized form wrappers with Suspense
export const LazyMediaReportForm = (props: any) => (
  <Suspense fallback={<FormSkeleton />}>
    <MediaReportForm {...props} />
  </Suspense>
);

export const LazySalesReportForm = (props: any) => (
  <Suspense fallback={<FormSkeleton />}>
    <SalesReportForm {...props} />
  </Suspense>
);

export default { LazyMediaReportForm, LazySalesReportForm };