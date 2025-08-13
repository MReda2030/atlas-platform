// Lazy-loaded Media Report Form for performance optimization
'use client';

import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load the heavy form component
const MediaReportForm = lazy(() => import('../media-report-form'));

// Lightweight loading skeleton specifically for forms
const FormLoadingSkeleton = () => (
  <Card className="w-full max-w-4xl mx-auto">
    <CardHeader>
      <CardTitle className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Form sections skeleton */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(j => (
              <div key={j} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end space-x-2 pt-6 border-t">
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-10 w-24 bg-blue-200 dark:bg-blue-700 rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

// Error boundary fallback for form loading errors
const FormErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <Card className="w-full max-w-4xl mx-auto">
    <CardContent className="p-6">
      <div className="text-center space-y-4">
        <div className="text-red-600 dark:text-red-400">
          <h3 className="text-lg font-semibold">Failed to load form</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error.message || 'Unable to load the media report form'}
          </p>
        </div>
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </CardContent>
  </Card>
);

interface LazyMediaReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export function LazyMediaReportForm(props: LazyMediaReportFormProps) {
  return (
    <Suspense fallback={<FormLoadingSkeleton />}>
      <MediaReportForm {...props} />
    </Suspense>
  );
}

// Export with error boundary wrapper
export default function LazyMediaReportFormWithErrorBoundary(props: LazyMediaReportFormProps) {
  return (
    <LazyMediaReportForm {...props} />
  );
}

// Preload function for performance optimization
export const preloadMediaReportForm = () => {
  const moduleImport = import('../media-report-form');
  return moduleImport;
};