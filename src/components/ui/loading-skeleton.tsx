import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function LoadingSkeleton({ className = '', width = '100%', height = '20px' }: LoadingSkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={{ width, height }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <LoadingSkeleton width="200px" height="32px" />
        <LoadingSkeleton width="100px" height="32px" />
      </div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg border">
            <LoadingSkeleton width="80px" height="16px" className="mb-2" />
            <LoadingSkeleton width="120px" height="36px" className="mb-2" />
            <LoadingSkeleton width="60px" height="14px" />
          </div>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg border">
          <LoadingSkeleton width="150px" height="24px" className="mb-4" />
          <LoadingSkeleton width="100%" height="300px" />
        </div>
        <div className="p-6 bg-white rounded-lg border">
          <LoadingSkeleton width="150px" height="24px" className="mb-4" />
          <LoadingSkeleton width="100%" height="300px" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <LoadingSkeleton width="150px" height="24px" />
        <LoadingSkeleton width="100px" height="32px" />
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <LoadingSkeleton width="200px" height="20px" />
            <LoadingSkeleton width="100px" height="20px" />
            <LoadingSkeleton width="80px" height="20px" />
            <LoadingSkeleton width="60px" height="20px" />
          </div>
        ))}
      </div>
    </div>
  );
}