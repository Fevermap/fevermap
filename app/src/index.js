import './app/fevermap-root.js';
import './assets/styles/base.scss';
import GoogleAnalyticsService from './app/services/google-analytics-service.js';
import { ServiceWorkerServiceInit } from './app/services/service-worker-service.js';
import PWAService from './app/services/pwa-service.js';
import SnackBar from './app/components/snackbar.js';

GoogleAnalyticsService.init();
if ('serviceWorker' in navigator) {
  ServiceWorkerServiceInit();
  setTimeout(() => {
    if (PWAService.installable()) {
      window.addEventListener('appinstalled', () => {
        SnackBar.success('PWA installed successfully');
      });
    }
  }, 1000);
}
