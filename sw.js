// 다나의 오락실 오프라인 지원
// 게임을 새로 추가하거나 고치면 아래 버전 숫자를 하나 올려주세요 (v28 → v29)
const CACHE = 'dana-arcade-v28';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './games/bangul-bakja.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon.png'
];
// 설치할 때 기억된 옛날 파일 말고 항상 새 파일을 받아요
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(SHELL.map(u => fetch(new Request(u, {cache: 'reload'})).then(r => r.ok ? c.put(u, r) : null).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // 페이지(화면)는 인터넷이 되면 항상 최신으로, 안 되면 저장해둔 걸로
  if (e.request.mode === 'navigate'){
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await Promise.race([
          fetch(new Request(e.request.url, {cache: 'no-cache'})),
          new Promise((_, rej) => setTimeout(() => rej(new Error('느림')), 4000))
        ]);
        if (r && r.ok) c.put(e.request, r.clone());
        return r;
      } catch(err){
        return (await c.match(e.request, {ignoreSearch: true})) || (await c.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  // 그림, 글꼴, 음악 같은 건 저장해둔 걸 먼저 쓰고 뒤에서 새로 받아둬요
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request, {cache: 'no-cache'}).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone());
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
