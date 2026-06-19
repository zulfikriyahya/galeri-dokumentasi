const CACHE_STATIC = "static-v1";
const CACHE_IMAGES = "images-v1";

const STATIC_ASSETS = ["/", "/albums", "/favicon.svg"];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_STATIC).then((c) => c.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== CACHE_STATIC && k !== CACHE_IMAGES)
                    .map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    const { request } = e;
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/img")) {
        e.respondWith(
            caches.open(CACHE_IMAGES).then(async (cache) => {
                const cached = await cache.match(request);
                if (cached) return cached;
                const res = await fetch(request);
                if (res.ok) cache.put(request, res.clone());
                return res;
            })
        );
        return;
    }

    if (request.destination === "document" || request.destination === "script" || request.destination === "style") {
        e.respondWith(
            caches.open(CACHE_STATIC).then(async (cache) => {
                try {
                    const res = await fetch(request);
                    if (res.ok) cache.put(request, res.clone());
                    return res;
                } catch {
                    return cache.match(request);
                }
            })
        );
    }
});