const CACHE_NAME = 'cafecontrol-cache-v1';
const ASSETS = [
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/db.js',
    './js/dashboard.js',
    './js/obreros.js',
    './js/lotes.js',
    './js/jornales.js',
    './js/asistencia.js',
    './js/comida.js',
    './js/caja.js',
    './js/cascota.js',
    './js/conversion.js',
    './js/ciclos.js',
    './js/historial.js',
    './js/transporte.js',
    './js/pagos.js',
    './js/reportes.js',
    './js/config.js',
    './js/lib/jspdf.umd.min.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(cachedResponse => {
                // 1. intentar servir desde cache
                if (cachedResponse) return cachedResponse;

                // 2. si no existe, buscar en red
                return fetch(e.request).then(networkResponse => {
                    // 3. guardar respuesta nueva en cache
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(e.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(err => {
                    console.warn('Fetch fallido en sw.js (posiblemente offline o recurso bloqueado):', err);
                    return new Response('', { status: 503, statusText: 'Service Unavailable' });
                });
            })
    );
});
