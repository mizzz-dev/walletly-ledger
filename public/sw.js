self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("walletly-v1").then((cache) => cache.addAll(["/", "/dashboard", "/transactions/new"])));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("/"))),
  );
});
