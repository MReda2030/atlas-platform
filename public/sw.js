// Atlas Platform Service Worker
// Provides basic caching and offline support

const CACHE_NAME = 'atlas-platform-v1';
const STATIC_ASSETS = [
  '/',
  '/auth/login',
  '/dashboard',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests and handle them normally
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        // Fetch from network and cache the response
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache successful responses
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('[SW] Fetch failed, serving offline page:', error);
            
            // Return a basic offline message for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <title>Atlas Platform - Offline</title>
                  <style>
                    body { font-family: -apple-system, sans-serif; text-align: center; padding: 50px; }
                    .offline { color: #666; }
                  </style>
                </head>
                <body>
                  <h1>Atlas Platform</h1>
                  <div class="offline">
                    <p>You're currently offline.</p>
                    <p>Please check your internet connection and try again.</p>
                  </div>
                </body>
                </html>`,
                { 
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }

            throw error;
          });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'PREFETCH_ROUTES':
        // Prefetch specified routes
        if (event.data.routes && Array.isArray(event.data.routes)) {
          caches.open(CACHE_NAME)
            .then(cache => {
              return Promise.all(
                event.data.routes.map(route => {
                  return fetch(route)
                    .then(response => {
                      if (response.ok) {
                        return cache.put(route, response);
                      }
                    })
                    .catch(console.warn);
                })
              );
            });
        }
        break;
        
      case 'CACHE_UPDATED':
        console.log('[SW] Cache update notification received');
        break;
        
      default:
        console.log('[SW] Unknown message type:', event.data.type);
    }
  }
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    // Handle background sync tasks here
  }
});