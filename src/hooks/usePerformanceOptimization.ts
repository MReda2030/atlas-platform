'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Advanced Performance Optimization Hook
 * 
 * Provides utilities for:
 * - Debounced functions
 * - Memoized calculations
 * - Component performance tracking
 * - Memory leak prevention
 */

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
}

interface UsePerformanceOptimizationOptions {
  enableTracking?: boolean;
  debounceDelay?: number;
  memoizationEnabled?: boolean;
  componentName?: string;
}

export const usePerformanceOptimization = (
  options: UsePerformanceOptimizationOptions = {}
) => {
  const {
    enableTracking = false,
    debounceDelay = 300,
    memoizationEnabled = true,
    componentName = 'Unknown'
  } = options;

  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>();
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Performance tracking
  useEffect(() => {
    if (!enableTracking) return;

    const startTime = performance.now();
    startTimeRef.current = startTime;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      renderCountRef.current += 1;
      renderTimesRef.current.push(renderTime);
      
      // Keep only last 10 render times for averaging
      if (renderTimesRef.current.length > 10) {
        renderTimesRef.current = renderTimesRef.current.slice(-10);
      }

      // Log performance warnings
      if (renderTime > 16.67) { // 60fps threshold
        console.warn(
          `🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (>${16.67}ms threshold)`
        );
      }
    };
  });

  // Debounced function creator
  const createDebouncedFunction = useCallback(
    <T extends (...args: any[]) => any>(
      func: T,
      delay: number = debounceDelay,
      key: string = 'default'
    ): T => {
      const debouncedFunc = ((...args: any[]) => {
        const timers = debounceTimersRef.current;
        
        if (timers.has(key)) {
          clearTimeout(timers.get(key)!);
        }

        const timer = setTimeout(() => {
          func(...args);
          timers.delete(key);
        }, delay);

        timers.set(key, timer);
      }) as T;

      return debouncedFunc;
    },
    [debounceDelay]
  );

  // Throttled function creator
  const createThrottledFunction = useCallback(
    <T extends (...args: any[]) => any>(
      func: T,
      delay: number = debounceDelay
    ): T => {
      const lastCallRef = useRef<number>(0);

      const throttledFunc = ((...args: any[]) => {
        const now = Date.now();
        if (now - lastCallRef.current >= delay) {
          lastCallRef.current = now;
          return func(...args);
        }
      }) as T;

      return throttledFunc;
    },
    [debounceDelay]
  );

  // Memoized calculation helper
  const memoizedCalculation = useCallback(
    <T>(calculation: () => T, dependencies: any[]): T => {
      if (!memoizationEnabled) {
        return calculation();
      }

      return useMemo(calculation, dependencies);
    },
    [memoizationEnabled]
  );

  // Optimized event handler creator
  const createOptimizedHandler = useCallback(
    <T extends (...args: any[]) => any>(
      handler: T,
      deps: any[] = [],
      options: { debounced?: boolean; throttled?: boolean; key?: string } = {}
    ): T => {
      const memoizedHandler = useCallback(handler, deps);

      if (options.debounced) {
        return createDebouncedFunction(memoizedHandler, debounceDelay, options.key);
      }

      if (options.throttled) {
        return createThrottledFunction(memoizedHandler, debounceDelay);
      }

      return memoizedHandler;
    },
    [createDebouncedFunction, createThrottledFunction, debounceDelay]
  );

  // Performance metrics
  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    const renderTimes = renderTimesRef.current;
    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      : 0;

    return {
      renderCount: renderCountRef.current,
      lastRenderTime: renderTimes[renderTimes.length - 1] || 0,
      averageRenderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || undefined
    };
  }, []);

  // Cleanup function for debounce timers
  useEffect(() => {
    return () => {
      const timers = debounceTimersRef.current;
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // Array optimization helpers
  const optimizedArrayMethods = useMemo(() => ({
    // Memoized filter
    filter: <T>(array: T[], predicate: (item: T) => boolean, deps: any[] = []) => 
      useMemo(() => array.filter(predicate), [array, ...deps]),

    // Memoized map
    map: <T, R>(array: T[], mapper: (item: T) => R, deps: any[] = []) =>
      useMemo(() => array.map(mapper), [array, ...deps]),

    // Memoized sort
    sort: <T>(array: T[], compareFn?: (a: T, b: T) => number, deps: any[] = []) =>
      useMemo(() => [...array].sort(compareFn), [array, ...deps]),

    // Virtualization helper for large lists
    getVisibleItems: <T>(
      array: T[], 
      startIndex: number, 
      endIndex: number
    ) => useMemo(
      () => array.slice(startIndex, endIndex),
      [array, startIndex, endIndex]
    )
  }), []);

  // Component state optimization helpers
  const stateOptimizers = useMemo(() => ({
    // Batch state updates
    batchUpdates: <T>(updates: Array<() => void>) => {
      // Use React's automatic batching in React 18+
      updates.forEach(update => update());
    },

    // Optimized object state update
    updateObjectState: <T extends Record<string, any>>(
      setState: (state: T | ((prevState: T) => T)) => void,
      key: keyof T,
      value: T[keyof T]
    ) => useCallback(
      () => setState(prev => ({ ...prev, [key]: value })),
      [setState, key, value]
    )
  }), []);

  return {
    // Function optimizers
    createDebouncedFunction,
    createThrottledFunction,
    createOptimizedHandler,
    
    // Calculation helpers
    memoizedCalculation,
    
    // Array optimizers
    ...optimizedArrayMethods,
    
    // State optimizers
    ...stateOptimizers,
    
    // Performance tracking
    getPerformanceMetrics,
    
    // Utilities
    isSlowRender: () => {
      const metrics = getPerformanceMetrics();
      return metrics.lastRenderTime > 16.67;
    },
    
    logPerformanceReport: () => {
      if (!enableTracking) return;
      
      const metrics = getPerformanceMetrics();
      console.group(`📊 Performance Report: ${componentName}`);
      console.log(`Renders: ${metrics.renderCount}`);
      console.log(`Average render time: ${metrics.averageRenderTime.toFixed(2)}ms`);
      console.log(`Last render time: ${metrics.lastRenderTime.toFixed(2)}ms`);
      if (metrics.memoryUsage) {
        console.log(`Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
      console.groupEnd();
    }
  };
};

export default usePerformanceOptimization;