/* Chromatica service worker: network first so updates show up immediately,
   cached copy as a fallback so the installed app still opens offline.
   Only same-origin files are cached; photos and APIs go straight to the network. */
const CACHE = 'chromatica-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-64.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const net = r.mode === 'navigate' ? fetch(r.url, { cache: 'no-cache' }) : fetch(r);
  e.respondWith(net.then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
});
