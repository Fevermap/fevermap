import './app/fevermap-root';
import './assets/styles/base.scss';
import PWAService from './app/services/pwa-service';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            registration.update();
        });
    });

    window.addEventListener('beforeinstallprompt', e => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        let deferredPrompt = e;
        PWAService.init(deferredPrompt);
    });
}
