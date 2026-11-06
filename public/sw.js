// Service worker mínimo: deixa o app instalável e abre offline (casca do app).
// Chamadas à OpenAI (outro domínio) NUNCA passam pelo cache.
const CACHE = 'lingua-tutor-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.json', '/icons/icon-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // rede primeiro (pega versão nova), cache como fallback offline
    e.respondWith(fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put('/', r.clone())); return r; }).catch(() => caches.match('/')));
    return;
  }
  // assets (JS com hash, ícones): cache primeiro
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }))
  );
});
