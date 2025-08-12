'use client';

import { useEffect, useState, memo } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface PagePerformanceMonitorProps {
  pageName: string;
  showMetrics?: boolean;
  enableLogging?: boolean;
  warningThreshold?: number;
}

interface PageMetrics {
  loadTime: number;
  renderCount: number;
  memoryUsage: number;
  slowRenders: number;
  totalRenderTime: number;
}

const PagePerformanceMonitor = memo(({ 
  pageName, 
  showMetrics = false, 
  enableLogging = true,
  warningThreshold = 1000 
}: PagePerformanceMonitorProps) => {
  const [pageMetrics, setPageMetrics] = useState<PageMetrics>({
    loadTime: 0,
    renderCount: 0,
    memoryUsage: 0,
    slowRenders: 0,
    totalRenderTime: 0
  });

  const [isVisible, setIsVisible] = useState(showMetrics);
  const [pageStartTime] = useState(performance.now());

  const { 
    getPerformanceMetrics, 
    logPerformanceReport,
    isSlowRender 
  } = usePerformanceOptimization({
    enableTracking: true,
    componentName: pageName
  });

  useEffect(() => {
    const updateMetrics = () => {
      const perfMetrics = getPerformanceMetrics();
      const currentTime = performance.now();
      
      setPageMetrics(prev => ({
        loadTime: currentTime - pageStartTime,
        renderCount: perfMetrics.renderCount,
        memoryUsage: perfMetrics.memoryUsage || 0,
        slowRenders: isSlowRender() ? prev.slowRenders + 1 : prev.slowRenders,
        totalRenderTime: perfMetrics.averageRenderTime * perfMetrics.renderCount
      }));
    };

    // Update metrics every second
    const interval = setInterval(updateMetrics, 1000);

    // Log warning if page load is slow
    setTimeout(() => {
      const loadTime = performance.now() - pageStartTime;
      if (loadTime > warningThreshold && enableLogging) {
        console.warn(`🐌 Slow page load: ${pageName} took ${loadTime.toFixed(2)}ms`);
      }
    }, warningThreshold);

    return () => {
      clearInterval(interval);
      if (enableLogging) {
        logPerformanceReport();
      }
    };
  }, [pageName, pageStartTime, warningThreshold, enableLogging, getPerformanceMetrics, logPerformanceReport, isSlowRender]);

  // Keyboard shortcut to toggle metrics display
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.5) return 'text-green-600';
    if (value <= threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border shadow-lg rounded-lg p-3 text-xs font-mono z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          📊 {pageName}
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={getPerformanceColor(pageMetrics.loadTime, 2000)}>
            {pageMetrics.loadTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Renders:</span>
          <span className={getPerformanceColor(pageMetrics.renderCount, 50)}>
            {pageMetrics.renderCount}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Slow Renders:</span>
          <span className={getPerformanceColor(pageMetrics.slowRenders, 5)}>
            {pageMetrics.slowRenders}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Total Render:</span>
          <span className={getPerformanceColor(pageMetrics.totalRenderTime, 100)}>
            {pageMetrics.totalRenderTime.toFixed(0)}ms
          </span>
        </div>
        
        {pageMetrics.memoryUsage > 0 && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={getPerformanceColor(pageMetrics.memoryUsage / 1024 / 1024, 50)}>
              {(pageMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t text-gray-500">
        <div>Ctrl+Shift+P to toggle</div>
      </div>
      
      {/* Performance grade */}
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between">
          <span>Grade:</span>
          <span className={`font-bold ${
            pageMetrics.slowRenders === 0 && pageMetrics.loadTime < 1000 ? 'text-green-600' :
            pageMetrics.slowRenders < 3 && pageMetrics.loadTime < 2000 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {pageMetrics.slowRenders === 0 && pageMetrics.loadTime < 1000 ? 'A' :
             pageMetrics.slowRenders < 3 && pageMetrics.loadTime < 2000 ? 'B' : 'C'}
          </span>
        </div>
      </div>
    </div>
  );
});

PagePerformanceMonitor.displayName = 'PagePerformanceMonitor';

export default PagePerformanceMonitor;