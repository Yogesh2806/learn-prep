/* Learn Prep service worker — hand-written, no build step.
 *
 * - App shell (pages): network-first, cached copy when offline.
 * - /_next/static/* (hashed, immutable): cache-first.
 * - Icons / manifest: stale-while-revalidate.
 * - /api/*: never cached here. The app caches API answers itself (localStorage), which
 *   is what "offline" means in Learn Prep: everything you've already seen.
 * Registered only in production builds.
 */
const VERSION = "lp-v1";
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // third-party APIs: the app handles them
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || new Response("Offline", { status: 503 }))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest" || url.pathname === "/icon.png") {
    event.respondWith(
      caches.match(req).then((hit) => {
        const live = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone(); // clone before the body can be consumed
              caches.open(SHELL).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || live;
      }),
    );
  }
});
