const CACHE = 'dokda-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/events.html',
  '/services.html',
  '/membership.html',
  '/about.html',
  '/donate.html',
  '/style.css',
  '/logo.png',
  '/DOKDA Volunteers.jpeg',
  '/JUma Prayer.jpeg',
  '/EID 2025.jpeg',
  '/EID 2026.jpeg',
  '/Dinner.png',
  '/Faraz Mehmood. Management picture.jpeg',
  '/Fahad Ijlal.jpeg'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache first, fall back to network, update cache in background
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Don't cache external APIs (prayer times, QR codes)
  if (!url.origin.includes('dokda.org') && url.hostname !== 'localhost' && !url.href.startsWith('file:')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'DOKDA Darmstadt';
  const options = {
    body: data.body || 'New update from DOKDA',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});
