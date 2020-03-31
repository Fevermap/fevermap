/* eslint-disable class-methods-use-this */
import { Workbox } from 'workbox-window';
import PWAService from './pwa-service.js';

export class ServiceWorkerService {
  constructor() {
    this.wb = new Workbox('service-worker.js');

    this.wb.addEventListener('waiting', () => {
      // console.log('Waiting to be allowed to install');
      // window.location.reload();
    });

    this.wb.register();

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
    const lastLocation = JSON.parse(localStorage.getItem('LAST_LOCATION'));
    ServiceWorkerService.sendMessage({
      type: 'SET_CLIENT_INFORMATION',
      clientId: localStorage.getItem('DEVICE_ID'),
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
  }

  static sendMessage(message) {
    ServiceWorkerService._instance.wb.messageSW(message);
  }
}

export default function ServiceWorkerServiceInit() {
  window.ServiceWorkerService = new ServiceWorkerService();
}
