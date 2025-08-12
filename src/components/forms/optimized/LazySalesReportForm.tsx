// Lazy-loaded Sales Report Form for performance optimization
'use client';

import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load the heavy form component
const SalesReportForm = lazy(() => import('../sales-report-form').then(module => ({
  default: module.SalesReportForm
})));

// Lightweight loading skeleton specifically for sales forms
const SalesFormLoadingSkeleton = () => (
  <Card className="w-full max-w-4xl mx-auto">
    <CardHeader>
      <CardTitle className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 animate-pulse mt-2" />
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Agent selection */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Countries section skeleton */}
      {[1, 2].map(i => (
        <div key={i} className="border rounded-lg p-4 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          
          {/* Deals section */}
          <div className="space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-10 w-24 bg-green-200 dark:bg-green-700 rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

interface LazySalesReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export function LazySalesReportForm(props: LazySalesReportFormProps) {
  return (
    <Suspense fallback={<SalesFormLoadingSkeleton />}>
      <SalesReportForm {...props} />
    </Suspense>
  );
}

// Export with error boundary wrapper
export default function LazySalesReportFormWithErrorBoundary(props: LazySalesReportFormProps) {
  return (
    <LazySalesReportForm {...props} />
  );
}

// Preload function for performance optimization
export const preloadSalesReportForm = () => {
  const moduleImport = import('../sales-report-form');
  return moduleImport;
};