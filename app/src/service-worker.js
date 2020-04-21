/* eslint-disable no-restricted-globals */
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim, skipWaiting } from 'workbox-core';
import * as googleAnalytics from 'workbox-google-analytics';
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import dayjs from 'dayjs';
import DataEntryService from './app/services/data-entry-service.js';
import Translator from './app/util/translator.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCPAiiuIPv0-0gEn_6kjjBBJt8DUasgo6M',
  authDomain: 'fevermap-95d71.firebaseapp.com',
  databaseURL: 'https://fevermap-95d71.firebaseio.com',
  projectId: 'fevermap-95d71',
  storageBucket: 'fevermap-95d71.appspot.com',
  messagingSenderId: '825429781563',
  appId: '1:825429781563:web:3ff8c7f6e4bbf23c10c01e',
  measurementId: 'G-3X5E6RLZBN',
};

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

/**
 * Set Data to service worker about the user. This data is normally stored in the localstorage,
 * but the service worker doesn't have access to the localstorage, so we need to send this
 * info to the service worker to persist seperately.
 *
 * This info is used for offline functionality and push notification responses.
 */
self.addEventListener('message', e => {
  switch (e.data.type) {
    case 'SET_CLIENT_INFORMATION':
      self.CLIENT_ID = e.data.clientId;
      self.BIRTH_YEAR = e.data.birthYear;
      self.GENDER = e.data.gender;
      self.COVID_DIAGNOSIS = e.data.covidDiagnosis;
      self.LOCATION_DATA = e.data.locationData;
      break;
    case 'SET_APP_URLS':
      self.API_URL = e.data.API_URL;
      self.APP_URL = e.data.APP_URL;
      break;
    case 'SET_LANGUAGE':
      self.LANGUAGE = e.data.LANGUAGE;
      break;
    case 'SET_LATEST_SUBMISSION_TIME':
      self.LATEST_SUBMISSION_TIME = e.data.LATEST_SUBMISSION_TIME;
      break;
    default:
      break;
  }
});

const hasUserSubmittedToday = () => {
  if (self.LATEST_SUBMISSION_TIME) {
    const latestSubmissionTime = dayjs(Number(self.LATEST_SUBMISSION_TIME));
    const todayMidnight = dayjs(Date.now()).set('hour', 0).set('minute', 0).set('second', 0);
    return latestSubmissionTime.isAfter(todayMidnight);
  }
  return false;
};

const createHealthStatusNotification = e => {
  const hasSubmittedTodayAlready = hasUserSubmittedToday();
  if (hasSubmittedTodayAlready) {
    return null;
  }
  Translator.setLang(self.LANGUAGE ? self.LANGUAGE.key : 'en');
  const options = {
    body: Translator.get('notification.daily_reminder.content'),
    badge: 'icon-64x64.png',
    icon: 'app-icon-128x128.png',
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
    },
    actions: [
      { action: 'log-healthy', title: Translator.get('notification.daily_reminder.healthy') },
      { action: 'log-not-healthy', title: Translator.get('notification.daily_reminder.sick') },
    ],
  };
  if (e) {
    return e.waitUntil(
      self.registration.showNotification(
        Translator.get('notification.daily_reminder.title'),
        options,
      ),
    );
  }
  return self.registration.showNotification(
    Translator.get('notification.daily_reminder.title'),
    options,
  );
};

const initFirebaseMessaging = () => {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.setBackgroundMessageHandler(e => {
    // Prevent duplicates by checking if push handler already handled this notification
    const messageData = e.data;
    if (messageData.timestamp === self.LAST_PUSH_NOTIFICATION_TIMESTAMP) {
      return null;
    }
    self.LAST_PUSH_NOTIFICATION_TIMESTAMP = e.data.json().data.timestamp;
    return createHealthStatusNotification();
  });
};

self.addEventListener('push', e => {
  const messageData = e.data.json().data;
  // Prevent duplicates by checking if firebase messaging already handled this notification
  if (messageData.timestamp === self.LAST_PUSH_NOTIFICATION_TIMESTAMP) {
    return null;
  }
  self.LAST_PUSH_NOTIFICATION_TIMESTAMP = e.data.json().data.timestamp;
  return createHealthStatusNotification(e);
});

const openAppFromNotification = (e, skipToEntryView) => {
  // This looks to see if the current page / app is already open and
  // focuses if it is
  const windowUrl = skipToEntryView ? '/?fromNotification=true' : '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i += 1) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(windowUrl);
      return null;
    }),
  );
};

const generateHealthyFeverDataSubmissionObject = () => ({
  device_id: self.CLIENT_ID,
  fever_status: false,
  fever_temp: null,
  birth_year: self.BIRTH_YEAR,
  gender: self.GENDER,
  location_country_code: self.LOCATION_DATA.location_country_code,
  location_postal_code: self.LOCATION_DATA.location_postal_code,
  location_lng: self.LOCATION_DATA.location_lng.toString(),
  location_lat: self.LOCATION_DATA.location_lat.toString(),
  symptom_difficult_to_breath: false,
  symptom_cough: false,
  symptom_sore_throat: false,
  symptom_muscle_pain: false,
  diagnosed_covid19: self.COVID_DIAGNOSIS,
});

const handleSuccessfulNotificationSubmit = () => {
  Translator.setLang(self.LANGUAGE ? self.LANGUAGE.key : 'en');
  const options = {
    body: Translator.get('notification.thank_you.content'),
    icon: 'app-icon-128x128.png',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
    },
  };
  self.registration.showNotification(Translator.get('notification.thank_you.title'), options);
};

const handleLoggingHealthy = () => {
  const apiSubmitUrl = `${self.API_URL}/api/v0/submit`;
  fetch(apiSubmitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(generateHealthyFeverDataSubmissionObject()),
  })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        handleSuccessfulNotificationSubmit(res);
        DataEntryService.setEntriesToIndexedDb(res);
        self.SUBMISSION_SENT_FROM_NOTIFICATION = true;
      }
    })
    // eslint-disable-next-line no-console
    .catch(err => console.error(err));
};

const handleLoggingSick = e => {
  openAppFromNotification(e, true);
};

self.onnotificationclick = e => {
  e.notification.close();
  switch (e.action) {
    case 'log-healthy':
      handleLoggingHealthy(e);
      break;
    case 'log-not-healthy':
      handleLoggingSick(e);
      break;
    default:
      openAppFromNotification(e, false);
      break;
  }
};

cleanupOutdatedCaches();
initFirebaseMessaging();
