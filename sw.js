const CACHE_NAME = 'lifescore-v1';
const ASSETS = ['.', 'index.html', 'css/styles.css', 'js/app.js'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('api.jsonbin.io') || event.request.url.includes('cdn.jsdelivr.net')) return;
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
