/**
 * 나고야 가족 여행 가이드 서비스 워커 (sw.js)
 * 오프라인 캐싱 및 PWA 설치 지원
 */

const CACHE_NAME = 'nagoya-trip-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './favicon.png',
  './apple-touch-icon.png',
  './images/icons/icon-192x192.png',
  './images/icons/icon-512x512.png',
  './images/icons/icon-maskable-192.png',
  './images/icons/icon-maskable-512.png'
];

// 1. 서비스 워커 설치: 개별 안전 캐싱 (단일 파일 실패 시에도 전체 설치 성공 보장)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Cache item failed (non-critical):', asset, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. 서비스 워커 활성화: 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 네트워크 요청 처리: Network First (최신 데이터 우선), 실패 시 캐시 반환 (오프라인 안전망)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // 외부 API나 도메인이 다르면 패스
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
