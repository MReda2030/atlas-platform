import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for analytics
const AnalyticsLoadingComponent = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
    <Skeleton className="h-64 w-full" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Loading component for filter panel
const FilterPanelLoadingComponent = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-full" />
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
);

// Loading component for insights panel
const InsightsPanelLoadingComponent = () => (
  <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  </div>
);

// Lazy loaded components with optimized loading states
export const LazyFilterPanel = dynamic(
  () => import('@/app/admin/analytics/components/OptimizedFilterPanel').then(mod => ({ default: mod.FilterPanel })),
  {
    loading: FilterPanelLoadingComponent,
    ssr: false, // Client-side only for better performance
  }
);

export const LazyReportVisualization = dynamic(
  () => import('@/app/admin/analytics/components/ReportVisualization').then(mod => ({ default: mod.ReportVisualization })),
  {
    loading: AnalyticsLoadingComponent,
    ssr: true, // Server-side render for SEO
  }
);

export const LazyInsightsPanel = dynamic(
  () => import('@/app/admin/analytics/components/InsightsPanel').then(mod => ({ default: mod.InsightsPanel })),
  {
    loading: InsightsPanelLoadingComponent,
    ssr: false, // Client-side only as it's below the fold
  }
);

export const LazyExportOptions = dynamic(
  () => import('@/app/admin/analytics/components/ExportOptions').then(mod => ({ default: mod.ExportOptions })),
  {
    loading: () => <Skeleton className="h-8 w-24" />,
    ssr: false,
  }
);

// Chart components (heavy dependencies)
export const LazyChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
);

// Data table component
export const LazyDataTable = dynamic(
  () => import('@/app/admin/master-data/_components/DataTable'),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    ssr: false,
  }
);

// Heavy form components
export const LazyMediaReportForm = dynamic(
  () => import('@/app/media/components/MediaReportForm'),
  {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    ),
    ssr: false,
  }
);