import './app/fevermap-root.js';
import './assets/styles/base.scss';
import { Workbox } from 'workbox-window';
import PWAService from './app/services/pwa-service.js';

if ('serviceWorker' in navigator) {
  const wb = new Workbox('service-worker.js');

  wb.addEventListener('waiting', () => {
    // console.log('Waiting to be allowed to install');
    // window.location.reload();
  });

  wb.register();

  window.addEventListener('beforeinstallprompt', e => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    const deferredPrompt = e;
    PWAService.init(deferredPrompt);
  });
}

// Init google analytics
