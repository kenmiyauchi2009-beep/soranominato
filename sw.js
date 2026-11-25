// オフライン用 service worker
// キャッシュがあればそれを返し、裏で新しい版を取りに行く（次に開いたとき新しい版になる）。
// ファイルを増やしたら ASSETS に足し、VERSION を上げる（index.html の APP_VERSION も同じ値に）。
// 取りに行くときはブラウザの一時保存（GitHub Pages は最大10分）を通さず、必ずサーバーに問い合わせる。
const VERSION = '0.7.1';
const CACHE = 'soranominato-' + VERSION;
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(ASSETS.map(u => fetch(u, { cache: 'reload' }).then(res => { if (!res.ok) throw new Error(u); return c.put(u, res); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const key = url.origin + url.pathname;   // ?以降を外した名前で1つだけ持つ
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(key);
    const net = fetch(url.href, { cache: 'no-cache' })
      .then(res => { if (res.ok) cache.put(key, res.clone()); return res; })
      .catch(() => hit);
    return hit || net;
  }));
});
