// SW Leads Jasa — network-first untuk HTML, cache-first untuk aset statis.
const CACHE = 'leads-jasa-v3';
const ASSETS = ['manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  // Apps Script & Google Sheets: selalu langsung ke internet
  if (/script\.google\.com|script\.googleusercontent\.com|docs\.google\.com/.test(url)) return;
  var isHTML = e.request.mode === 'navigate' || /\.html($|\?)/.test(url) || /\/$/.test(url.split('?')[0]);
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('./'); }); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        if (res && res.status === 200) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); }
        return res;
      });
    })
  );
});
