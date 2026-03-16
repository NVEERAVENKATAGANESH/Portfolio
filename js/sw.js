'use strict';
const CACHE = 'portfolio-v1';
const OFFLINE = [
  '/',
  '/index.html',
  '/gallery.html',
  '/404.html',
  '/css/tokens.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/main.js',
  '/js/gallery.js',
  '/js/nav.js',
  '/js/animations.js',
  '/js/background.js',
  '/manifest.webmanifest',
  '/images/Headshot.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
