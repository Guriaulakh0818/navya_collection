/**
 * JIIVAAKART SERVICE WORKER FOR WEB PUSH NOTIFICATIONS
 * Handles background push events, screen notification displays, and click navigation.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'JiivaaKart • Style That Speaks',
    body: 'New fashion offers and boutique arrivals are live!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    url: '/',
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    image: data.image || undefined,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open_url', title: 'View Offer 🛍️' },
      { action: 'dismiss', title: 'Close' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, notificationOptions));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
