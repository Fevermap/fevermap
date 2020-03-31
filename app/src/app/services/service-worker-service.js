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
    ServiceWorkerService.sendMessage({
      type: 'SET_CLIENT_ID',
      clientId: localStorage.getItem('DEVICE_ID'),
    });
  }

  static sendMessage(message) {
    ServiceWorkerService._instance.wb.messageSW(message);
  }
}

export default function ServiceWorkerServiceInit() {
  window.ServiceWorkerService = new ServiceWorkerService();
}
