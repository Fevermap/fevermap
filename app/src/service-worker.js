import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import * as navigationPreload from 'workbox-navigation-preload';

const OFFLINE_CACHE_NAME = 'offline-cache';
const OFFLINE_FALLBACK_HTML_URL = '/index.html';

self.__WB_DISABLE_DEV_LOGS = true;

registerRoute(/\.js$/, new NetworkFirst());

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(
    /\.(?:js|css)$/,
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
    })
);

registerRoute(
    /\.(?:png|gif|jpg|jpeg|webp|svg)$/,
    new CacheFirst({
        cacheName: 'images',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }),
        ],
    })
);
// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
    })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 30,
            }),
        ],
    })
);

cleanupOutdatedCaches();
