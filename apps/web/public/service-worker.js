// Basic offline cache
const CACHE = 'typeb-cache-v1';
const ASSETS = ['/', '/favicon-32.png', '/favicon-16.png', '/type_b_logo.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve(true)))))
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(req, clone));
        return resp;
      }).catch(() => caches.match('/'))
    )
  );
});






