// オフライン用 service worker
// キャッシュがあればそれを返し、裏で新しい版を取りに行く（次に開いたとき新しい版になる）。
// ファイルを増やしたら ASSETS に足し、VERSION を上げる。
const VERSION = '0.4.0';
const CACHE = 'soranominato-' + VERSION;
const ASSETS = ['./', 'index.html', 'manifest.webmanifest'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
