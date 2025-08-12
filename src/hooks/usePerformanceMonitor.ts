import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  apiCallDuration?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTimeRef = useRef<number>();
  const mountTimeRef = useRef<number>();
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    // Record component mount time
    mountTimeRef.current = performance.now();
    
    return () => {
      // Record component unmount and calculate total mount time
      if (mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        
        
        // Store metrics for analysis
        metricsRef.current.push({
          componentName,
          renderTime: 0,
          mountTime: mountDuration,
        });
      }
    };
  }, [componentName]);

  // Function to measure render performance
  const measureRender = (callback: () => void) => {
    startTimeRef.current = performance.now();
    callback();
    
    requestAnimationFrame(() => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current;
        
        
        metricsRef.current.push({
          componentName,
          renderTime,
          mountTime: 0,
        });
      }
    });
  };

  // Function to measure API call performance
  const measureApiCall = async <T,>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      
      metricsRef.current.push({
        componentName: `${componentName}-${apiName}`,
        renderTime: 0,
        mountTime: 0,
        apiCallDuration: duration,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      console.error(`[Performance] ${apiName} API call failed after ${duration.toFixed(2)}ms:`, error);
      
      throw error;
    }
  };

  // Function to get performance summary
  const getPerformanceMetrics = (): PerformanceMetrics[] => {
    return [...metricsRef.current];
  };

  return {
    measureRender,
    measureApiCall,
    getPerformanceMetrics,
  };
}

// Hook for Core Web Vitals monitoring
export function useWebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = entry.startTime;
          }
          
          if (entry.entryType === 'first-input') {
            const fid = entry.processingStart - entry.startTime;
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });

      // Monitor Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      return () => {
        observer.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);
}

// Performance utility functions
export const performanceUtils = {
  // Debounce function for API calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  // Throttle function for scroll handlers
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },

  // Memory usage monitoring
  getMemoryUsage: (): string => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return `Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`;
    }
    return 'Memory monitoring not supported';
  },
};