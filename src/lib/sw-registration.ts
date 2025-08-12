'use client';

// Service Worker registration utility
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[SW] Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('[SW] New version available');
                
                // Optionally show user notification about update
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Atlas Platform Updated', {
                    body: 'A new version is available. Refresh to update.',
                    icon: '/favicon.ico',
                    tag: 'update-available'
                  });
                }
              }
            });
          }
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('[SW] Cache updated for:', event.data.url);
          }
        });

      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error);
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      console.log('[SW] Back online');
      // Trigger background sync if supported
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('background-sync');
        });
      }
    });

    window.addEventListener('offline', () => {
      console.log('[SW] Gone offline');
    });
  }
}

// Utility to check if app is running offline
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

// Utility to prefetch critical routes
export async function prefetchRoutes(routes: string[]) {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'PREFETCH_ROUTES',
        routes
      });
    }
  }
}

// Clear all caches (useful for development/debugging)
export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  }
}