// Circles Service Worker
// Handles caching, offline support, and push notifications

const CACHE_NAME = 'circles-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls - always go to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone();

        // Cache successful responses for static assets
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache same-origin requests
            if (url.origin === location.origin) {
              cache.put(request, responseClone);
            }
          });
        }

        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, return offline page
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
        }

        // Return a simple offline response for other requests
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Circles',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'circles-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/';

  // Handle different notification types
  if (notificationData.type === 'invite') {
    targetUrl = '/?tab=activity';
  } else if (notificationData.type === 'status') {
    targetUrl = '/';
  } else if (notificationData.url) {
    targetUrl = notificationData.url;
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'accept':
        targetUrl = `/?action=accept&inviteId=${notificationData.inviteId}`;
        break;
      case 'decline':
        targetUrl = `/?action=decline&inviteId=${notificationData.inviteId}`;
        break;
      case 'view':
        targetUrl = '/?tab=activity';
        break;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-invites') {
    event.waitUntil(syncPendingInvites());
  } else if (event.tag === 'sync-status') {
    event.waitUntil(syncPendingStatus());
  }
});

// Sync pending invites when back online
async function syncPendingInvites() {
  // This will be implemented when we have the API
  console.log('[SW] Syncing pending invites...');
}

// Sync pending status updates when back online
async function syncPendingStatus() {
  // This will be implemented when we have the API
  console.log('[SW] Syncing pending status...');
}

// Message event - for communication with the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
