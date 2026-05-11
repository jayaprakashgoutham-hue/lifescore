const CACHE_NAME = 'lifescore-v19';
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
    // Let Firebase and CDN requests go directly to network
    if (event.request.url.includes('firebasedatabase.app') ||
        event.request.url.includes('gstatic.com') ||
        event.request.url.includes('googleapis.com')) return;
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
