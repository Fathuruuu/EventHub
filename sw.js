/**
 * EventHub - Service Worker for PWA (Android & iOS)
 * Mendukung instalasi aplikasi native, offline fallback & caching cepat
 */
const CACHE_NAME = 'eventhub-pwa-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './sistem-utama/tema-desain.css',
  './sistem-utama/tata-letak-pos.css',
  './sistem-utama/database.js',
  './sistem-utama/efek-suara.js',
  './sistem-utama/efek-selebrasi.js',
  './sistem-utama/generator-qr.js',
  './scanner-kamera/jsqr-engine.js',
  './scanner-kamera/camera-scanner.js',
  './sistem-utama/navigasi-router.js',
  './otentikasi-akun/auth.js',
  './sistem-peserta/peserta.js',
  './sistem-peserta/fast-track.js',
  './sistem-pembayaran/pembayaran.js',
  './panel-penyelenggara/kasir-organizer.js',
  './panel-admin/dashboard-admin.js',
  './sistem-utama/koordinator-aplikasi.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('PWA Asset caching partially completed:', err);
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
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Hanya intercept GET requests
  if (e.request.method !== 'GET') return;

  // Network first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
