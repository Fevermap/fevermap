import './app/fevermap-root';
import './assets/styles/base.scss';
import PWAService from './app/services/pwa-service';
import { Workbox } from 'workbox-window';

if ('serviceWorker' in navigator) {
    const wb = new Workbox('service-worker.js');

    wb.addEventListener('installed', event => {
        if (event.isUpdate) {
        }
    });

    wb.addEventListener('waiting', () => {
        console.log('Waiting to be allowed to install');
        //window.location.reload();
    });

    wb.register();

    window.addEventListener('beforeinstallprompt', e => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        let deferredPrompt = e;
        PWAService.init(deferredPrompt);
    });
}

//Init google analytics
