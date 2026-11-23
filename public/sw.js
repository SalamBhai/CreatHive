/* CreatHive service worker.
 *
 * - Precaches the app shell (landing, explore, fonts, brand art, scene photos)
 * - Navigations: network-first, falling back to the cached page, then the shell
 * - Static assets: cache-first (their URLs are content-hashed by Next.js)
 * - API, auth, RSC and private routes (/studio, /admin, /join) are never cached
 */

const SHELL_CACHE = 'creathive-shell-v1';
const PAGE_CACHE = 'creathive-pages-v1';
const ASSET_CACHE = 'creathive-assets-v1';

const SHELL_ASSETS = [
  '/',
  '/explore',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/images/creathive-wordmark.png',
  '/fonts/Playball-Regular.ttf',
  '/fonts/PlusJakartaSans-Regular.ttf',
  '/fonts/PlusJakartaSans-Medium.ttf',
  '/fonts/PlusJakartaSans-SemiBold.ttf',
  '/fonts/PlusJakartaSans-Bold.ttf',
  '/fonts/PlusJakartaSans-ExtraBold.ttf',
  '/fonts/Newsreader-Regular.ttf',
  '/fonts/Newsreader-SemiBold.ttf',
  '/fonts/Newsreader-Italic.ttf',
  '/images/scenes/hero.jpg',
  '/images/scenes/spoken-word.jpg',
  '/images/scenes/poetry.jpg',
  '/images/scenes/dance.jpg',
  '/images/scenes/design.jpg',
  '/images/scenes/closing.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, PAGE_CACHE, ASSET_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/') ||
    /\.(?:js|css|woff2?|ttf|png|jpe?g|svg|webp|ico|json)$/.test(pathname)
  );
}

const PRIVATE_ROUTES = ['/studio', '/admin', '/join'];

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  const pathname = new URL(request.url).pathname;
  const isPrivate = PRIVATE_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
  try {
    const response = await fetch(request);
    if (!isPrivate && response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await caches.match('/', { ignoreSearch: true })) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(ASSET_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // cross-origin: let the browser handle it
  if (url.pathname === '/sw.js' || url.pathname.startsWith('/api/')) return;
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

/* ---------- Web Push ---------- */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // A plain-text payload is still better than no notification.
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'CreatHive';
  const body = typeof data.body === 'string' ? data.body : 'You have a new update from CreatHive.';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: typeof data.tag === 'string' ? data.tag : 'creathive',
      data: { url: typeof data.url === 'string' ? data.url : '/studio' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Never let a payload open an arbitrary origin.
  let target = self.location.origin + '/studio';
  try {
    const url = new URL(event.notification.data?.url || '/studio', self.location.origin);
    if (url.origin === self.location.origin) target = url.href;
  } catch {
    // keep the safe default
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const match = windows.find((client) => client.url === target);
      return match ? match.focus() : clients.openWindow(target);
    })
  );
});
