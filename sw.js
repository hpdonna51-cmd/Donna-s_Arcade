// 다나의 오락실 오프라인 지원
// 게임을 새로 추가하거나 고치면 아래 버전 숫자를 하나 올려주세요 (v1 → v2)
const CACHE = 'dana-arcade-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './games/bangul-bakja.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// 저장해둔 걸 먼저 보여주고, 인터넷이 되면 뒤에서 새 버전으로 바꿔둬요
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone());
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
