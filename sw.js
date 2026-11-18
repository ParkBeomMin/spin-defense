// 스핀 디펜스 서비스워커: 한 번 받은 그림·소리·폰트는 저장해두고 바로 띄움
// - 페이지(HTML)와 공지(notices.json)는 항상 네트워크 먼저 (업데이트가 바로 보이게), 안 되면 저장본
// - 나머지 같은 사이트 파일은 저장본 먼저 + 뒤에서 새로 받아 갱신 (index.html의 ASSET_V가 바뀌면 주소가 달라져 새로 받음)
const CACHE = 'sd-v3'; // 그림 파일을 바꿔 배포할 때마다 숫자를 올려 예전 저장본을 지움
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './assets/anim.json', './assets/bg.jpg']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const fresh = req.mode === "navigate" || /\.html$|notices\.json$|anim\.json$|\.webmanifest$|\/$/.test(url.pathname);
  if (fresh) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
