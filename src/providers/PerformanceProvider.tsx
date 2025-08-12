'use client';

import { ReactNode, useEffect } from 'react';
import { initPerformanceMonitoring } from '@/lib/performance-monitoring';
import { registerServiceWorker } from '@/lib/sw-registration';

interface PerformanceProviderProps {
  children: ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Register service worker for offline capabilities
    registerServiceWorker();

    // Request notification permission for updates
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('[Performance] Notification permission:', permission);
      });
    }
  }, []);

  return <>{children}</>;
}