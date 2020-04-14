/* eslint-disable class-methods-use-this */
import { Workbox } from 'workbox-window';
import PWAService from './pwa-service.js';
import NotificationService from './notification-service.js';

export default class ServiceWorkerService {
  constructor() {
    this.wb = new Workbox('service-worker.js');
    this.wb.addEventListener('waiting', () => {
      // console.log('Waiting to be allowed to install');
      // window.location.reload();
    });

    // As a new service worker gains access, update the page so that new content
    // is reloaded to the user
    this.wb.addEventListener('controlling', () => {
      // console.info('[WB]: Service Worker updated. Reloading...');
      window.location.reload();
    });

    this.wb.register().then(reg => {
      NotificationService.initFirebase(reg);
    });

    window.addEventListener('beforeinstallprompt', e => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      const deferredPrompt = e;
      PWAService.init(deferredPrompt);
    });
    ServiceWorkerService._instance = this;
    this.sendClientInformationToServiceWorker();
  }

  /**
   * Make sure the Service worker is up to date with the current
   * device information.
   *
   * The Service worker needs to know this information for
   * push notification and offline use.
   */
  sendClientInformationToServiceWorker() {
    const clientId = localStorage.getItem('DEVICE_ID');
    const lastLocation = JSON.parse(localStorage.getItem('LAST_LOCATION'));
    if (!clientId || !lastLocation) {
      return;
    }
    ServiceWorkerService.sendMessage({
      type: 'SET_CLIENT_INFORMATION',
      clientId,
      birthYear: localStorage.getItem('BIRTH_YEAR'),
      gender: localStorage.getItem('GENDER'),
      covidDiagnosis: localStorage.getItem('COVID_DIAGNOSIS'),
      locationData: {
        location_country_code: lastLocation.countryShort,
        location_postal_code: lastLocation.postal_code,
        location_lng: lastLocation.coords.lng,
        location_lat: lastLocation.coords.lat,
      },
    });
    ServiceWorkerService.sendMessage({
      type: 'SET_APP_URLS',
      API_URL: process.env.API_URL || window.URLS.API_URL,
      APP_URL: process.env.APP_URL || window.URLS.APP_URL,
    });
    const latestSubmissionTime = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
    if (latestSubmissionTime) {
      ServiceWorkerService.sendMessage({
        type: 'SET_LATEST_SUBMISSION_TIME',
        LATEST_SUBMISSION_TIME: latestSubmissionTime,
      });
    }
  }

  static sendMessage(message) {
    ServiceWorkerService._instance.wb.messageSW(message);
  }
}

export function syncClientInformation() {
  ServiceWorkerService._instance.sendClientInformationToServiceWorker();
}

export function ServiceWorkerServiceInit() {
  window.ServiceWorkerService = new ServiceWorkerService();
}
