self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("walletly-v1").then((cache) => cache.addAll(["/", "/dashboard", "/transactions/new", "/notifications"])));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("/"))),
  );
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "walletly-shared 通知",
    body: "新しい通知があります。",
    url: "/notifications",
  };

  const payload = (() => {
    if (!event.data) {
      return fallback;
    }

    try {
      const data = event.data.json() as { title?: string; body?: string; url?: string };
      return {
        title: data.title ?? fallback.title,
        body: data.body ?? fallback.body,
        url: data.url ?? fallback.url,
      };
    } catch {
      return fallback;
    }
  })();

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/notifications";
  event.notification.close();
  event.waitUntil(clients.openWindow(url));
});
