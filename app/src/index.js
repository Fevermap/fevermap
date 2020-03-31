import './app/fevermap-root.js';
import './assets/styles/base.scss';
import GoogleAnalyticsService from './app/services/google-analytics-service.js';
import ServiceWorkerServiceInit from './app/services/service-worker-service.js';

GoogleAnalyticsService.init();
if ('serviceWorker' in navigator) {
  ServiceWorkerServiceInit();
}
