/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{url: string; revision: string | null}>;
};

// Workbox manifest placeholder (required by workbox but not directly used)
const _manifest = self.__WB_MANIFEST;

const CACHE_NAME = 'lagermanagement-v1';
const STATIC_ASSETS: string[] = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache: Cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys: string[]) => {
      return Promise.all(
        keys.filter((key: string) => key !== CACHE_NAME)
            .map((key: string) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first for assets, network-first for API
self.addEventListener('fetch', (event: FetchEvent) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) schemes
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Network-first for Firebase/API calls
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((response: Response | undefined) =>
          response || new Response('Network error', { status: 408 })
        )
      )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached: Response | undefined) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response: Response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache: Response = response.clone();
        caches.open(CACHE_NAME).then((cache: Cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

export {};
