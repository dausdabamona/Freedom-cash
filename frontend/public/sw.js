// Service Worker for Freedom Navigator PWA
// Version 1.0.0

const CACHE_VERSION = 'freedom-navigator-v1';
const CACHE_SHELL = `${CACHE_VERSION}-shell`;
const CACHE_API = `${CACHE_VERSION}-api`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;

// Assets to cache immediately on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
const API_CACHE_ENDPOINTS = [
  '/api/freedom/summary',
  '/api/dashboard',
];

// Install event - cache shell assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      console.log('[SW] Caching shell assets');
      return cache.addAll(SHELL_ASSETS).catch((error) => {
        console.error('[SW] Failed to cache shell assets:', error);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    }).then(() => {
      console.log('[SW] Service worker installed successfully');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (cacheName.startsWith('freedom-navigator-') && cacheName !== CACHE_SHELL && cacheName !== CACHE_API && cacheName !== CACHE_IMAGES) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: API requests - Stale-While-Revalidate with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      handleAPIRequest(request, url)
    );
    return;
  }

  // Strategy 2: Images - Cache First
  if (request.destination === 'image') {
    event.respondWith(
      handleImageRequest(request)
    );
    return;
  }

  // Strategy 3: Shell assets (HTML, CSS, JS) - Cache First with Network Fallback
  event.respondWith(
    handleShellRequest(request)
  );
});

// Handle API requests with Stale-While-Revalidate + Offline Snapshot
async function handleAPIRequest(request, url) {
  const cacheName = CACHE_API;

  try {
    // Try to get from cache first (stale)
    const cachedResponse = await caches.match(request);

    // Fetch from network (revalidate)
    const networkPromise = fetch(request).then(async (response) => {
      if (response.ok) {
        // Clone and cache the response
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());

        // Store timestamp for offline fallback
        await storeLastUpdate(url.pathname);
      }
      return response;
    }).catch((error) => {
      console.log('[SW] Network fetch failed:', error);
      // If network fails and we have cache, return it
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise throw to trigger offline fallback
      throw error;
    });

    // Return cached response immediately if available, otherwise wait for network
    return cachedResponse || networkPromise;
  } catch (error) {
    console.error('[SW] API request failed:', error);

    // Offline fallback - return last cached snapshot
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Returning cached snapshot (offline mode)');
      return cachedResponse;
    }

    // If no cache available, return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline - No cached data available',
        offline: true,
        message: 'Anda sedang offline. Koneksikan ke internet untuk data terbaru.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle image requests with Cache First strategy
async function handleImageRequest(request) {
  const cacheName = CACHE_IMAGES;

  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Image request failed:', error);
    // Return placeholder or cached version
    return caches.match(request) || new Response('', { status: 404 });
  }
}

// Handle shell requests with Cache First strategy
async function handleShellRequest(request) {
  const cacheName = CACHE_SHELL;

  try {
    // Try cache first for fast loading
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached and update in background
      fetch(request).then((response) => {
        if (response.ok) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, response.clone());
          });
        }
      }).catch(() => {
        // Ignore background update failures
      });

      return cachedResponse;
    }

    // Fetch from network if not in cache
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Shell request failed:', error);

    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return caches.match('/index.html') || new Response('Offline', { status: 503 });
  }
}

// Store last update timestamp for offline detection
async function storeLastUpdate(endpoint) {
  try {
    const cache = await caches.open(CACHE_API);
    const timestamp = new Date().toISOString();
    const metaResponse = new Response(JSON.stringify({ lastUpdate: timestamp }), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(`${endpoint}-meta`, metaResponse);
  } catch (error) {
    console.error('[SW] Failed to store last update:', error);
  }
}

// Background sync for queued requests (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Placeholder for syncing queued data when back online
    console.log('[SW] Syncing queued data...');
    // Implementation here for POST/PUT requests that failed offline
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'Cek progress kebebasan finansial Anda!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Buka Dashboard',
      },
      {
        action: 'close',
        title: 'Tutup',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Freedom Navigator', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker loaded');
