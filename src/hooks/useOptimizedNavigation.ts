'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { navigationCache } from '@/lib/navigation-cache';

export function useOptimizedNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Prefetch critical routes on mount
  useEffect(() => {
    const criticalRoutes = ['/dashboard', '/media', '/sales'];
    criticalRoutes.forEach(route => {
      if (route !== pathname) {
        router.prefetch(route);
        navigationCache.preloadRoute(route);
      }
    });
  }, [router, pathname]);

  // Optimized navigation with loading states
  const navigateTo = useCallback(async (path: string) => {
    try {
      // Show loading indicator
      document.body.style.cursor = 'wait';
      
      // Preload route data
      await navigationCache.preloadRoute(path);
      
      // Navigate
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push(path); // Fallback to normal navigation
    } finally {
      // Reset cursor
      setTimeout(() => {
        document.body.style.cursor = 'default';
      }, 100);
    }
  }, [router]);

  return { navigateTo };
}