import './app/fevermap-root.js';
import './assets/styles/base.scss';
<<<<<<< HEAD
import { Workbox } from 'workbox-window';
import PWAService from './app/services/pwa-service.js';
import GoogleAnalyticsService from './app/services/google-analytics-service.js';
=======
import ServiceWorkerServiceInit from './app/services/service-worker-service.js';
>>>>>>> dcce106... Feat: Service worker handles messaging and client id information

GoogleAnalyticsService.init();
if ('serviceWorker' in navigator) {
  ServiceWorkerServiceInit();
}

// Init google analytics
