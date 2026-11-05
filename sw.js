/**
 * EventHub Pro - Progressive Web App Service Worker (v6.0)
 * Multi-Device Offline Engine, Standalone Caching, & Background Sync for:
 * Android, iOS, Windows, macOS, Linux, and ChromeOS
 */

const CACHE_NAME = 'eventhub-pwa-v8.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon.png',
  './sistem-utama/tema-desain.css?v=8.0',
  './sistem-utama/tata-letak-pos.css?v=8.0',
  './sistem-utama/moneyflow.css?v=8.0',
  './otentikasi-akun/auth.css?v=8.0',
  './sistem-peserta/peserta.css?v=8.0',
  './sistem-pembayaran/pembayaran.css?v=8.0',
  './panel-penyelenggara/kasir-organizer.css?v=8.0',
  './panel-admin/dashboard-admin.css?v=8.0',
  './sistem-utama/database.js?v=8.0',
  './sistem-utama/efek-suara.js?v=8.0',
  './sistem-utama/efek-selebrasi.js?v=8.0',
  './sistem-utama/generator-qr.js?v=8.0',
  './scanner-kamera/jsqr-engine.js?v=8.0',
  './scanner-kamera/camera-scanner.js?v=8.0',
  './sistem-utama/i18n-bahasa.js?v=8.0',
  './sistem-utama/navigasi-router.js?v=8.0',
  './sistem-utama/moneyflow.js?v=8.0',
  './otentikasi-akun/auth.js?v=8.0',
  './sistem-peserta/peserta.js?v=8.0',
  './sistem-peserta/favorit-peserta.js?v=8.0',
  './sistem-peserta/pesan-peserta.js?v=8.0',
  './sistem-peserta/fast-track.js?v=8.0',
  './sistem-pembayaran/pembayaran.js?v=8.0',
  './panel-penyelenggara/kasir-organizer.js?v=8.0',
  './panel-penyelenggara/pesan-organizer.js?v=8.0',
  './panel-admin/dashboard-admin.js?v=8.0',
  './panel-admin/approval-penyelenggara.js?v=8.0',
  './panel-admin/pantau-aktivitas.js?v=8.0',
  './panel-admin/audit-feedback.js?v=8.0',
  './sistem-utama/koordinator-aplikasi.js?v=8.0'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Precache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            console.log('[PWA SW] Clearing outdated cache:', k);
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Hanya proses request GET
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Jangan cache API dynamic endpoints
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // HTML Navigation: Network-first, fallback to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          return networkRes;
        })
        .catch(() => caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  // Network-First for all assets: always fetch fresh from network, fallback to cache when offline
  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return networkRes;
      })
      .catch(() => caches.match(e.request) || (e.request.mode === 'navigate' ? caches.match('./index.html') : null))
  );
});
