/* eslint-disable no-restricted-globals */
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim, skipWaiting } from 'workbox-core';
import * as googleAnalytics from 'workbox-google-analytics';

self.__WB_DISABLE_DEV_LOGS = true;

skipWaiting();
clientsClaim();

googleAnalytics.initialize();

registerRoute(/\.js$/, new NetworkFirst());

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(
  /\.(?:js|css)$/,
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  }),
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
  }),
);
// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  }),
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
  }),
);

self.addEventListener('message', e => {
  console.log('SW: new message: ', e);
  switch (e.data.type) {
    case 'SET_CLIENT_ID':
      self.CLIENT_ID = e.data.clientId;
      break;
    default:
      break;
  }
  console.log(self.CLIENT_ID);
});

self.addEventListener('push', e => {
  const options = {
    body: 'How are you feeling today?',
    icon: 'app-icon-128x128.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
    },
    actions: [
      { action: 'log-healthy', title: 'Healthy' },
      { action: 'log-not-healthy', title: 'Sick' },
    ],
  };
  e.waitUntil(self.registration.showNotification('Good morning! :)', options));
});

const openAppFromNotification = e => {
  // This looks to see if the current page / app is already open and
  // focuses if it is
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i += 1) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/?fromNotification=true');
      return null;
    }),
  );
};

const handleLoggingHealthy = e => {};

const handleLoggingSick = e => {
  openAppFromNotification(e);
};

self.onnotificationclick = e => {
  switch (e.action) {
    case 'log-healthy':
      handleLoggingHealthy(e);
      break;
    case 'log-not-healthy':
      handleLoggingSick(e);
      break;
    default:
      // Open app
      openAppFromNotification(e);
      break;
  }
};

cleanupOutdatedCaches();
