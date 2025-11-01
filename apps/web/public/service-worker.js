// Progressive Web App Service Worker - safer caching for Next.js
// Ensures new deploys show immediately (network-first for HTML), while static assets use cache-first.

const VERSION = '2025-10-31-1';
const CACHE_STATIC = `typeb-static-${VERSION}`;
const CACHE_PAGES = `typeb-pages-${VERSION}`;
const OFFLINE_FALLBACK = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_PAGES).then((cache) => cache.addAll([OFFLINE_FALLBACK]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== CACHE_STATIC && k !== CACHE_PAGES) {
            return caches.delete(k);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

function isStaticAsset(url) {
  if (url.pathname.startsWith('/_next/')) return true; // Next hashed assets
  return /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/i.test(url.pathname);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const resp = await fetch(request);
  const cache = await caches.open(CACHE_STATIC);
  cache.put(request, resp.clone());
  return resp;
}

async function networkFirst(request) {
  try {
    const resp = await fetch(request, { cache: 'no-store' });
    const cache = await caches.open(CACHE_PAGES);
    cache.put(request, resp.clone());
    return resp;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_FALLBACK);
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (isNavigationRequest(req)) {
    event.respondWith(networkFirst(req));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(networkFirst(req));
});

// Allow the page to tell the SW to skip waiting immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});






