self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("dart-scorer-cache").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/app.js",
        "/engine/state.js",
        "/engine/match.js",
        "/engine/doubles.js",
        "/engine/players.js",
        "/engine/checkout.js",
        "/data/checkout_table.js"
      ]);
    })
  );

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
