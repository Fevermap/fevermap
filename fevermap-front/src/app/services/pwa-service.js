import Dialog from '../components/dialog';

export default class PWAService {
    static init(deferredPrompt) {
        if (!deferredPrompt) {
            return;
        }
        PWAService._instance = new PWAService(deferredPrompt);
    }

    constructor(deferredPrompt) {
        this.deferredPrompt = deferredPrompt;
        this.hasPromptedInstallDialog = false;
        document.addEventListener('mouseup', () => this.openInstallDialog());
        document.addEventListener('dragend', () => this.openInstallDialog());
    }

    openInstallDialog() {
        document.removeEventListener('mouseup', this.openInstallDialog);
        document.removeEventListener('dragend', this.openInstallDialog);
        if (this.hasPromptedInstallDialog) {
            return;
        }
        Dialog.open({
            title: 'Install Fever Map',
            content:
                'Fever Map can be installed as a Progressive Web Application. If installed, we can provide you with great extra features like faster runtime and push notifications (coming soon).',
            approveText: 'Install',
            declineText: 'Maybe later',
            approveEvent: 'pwa-install-approve',
            declineEvent: 'pwa-install-decline',
        });
        this.hasPromptedInstallDialog = true;
        document.addEventListener('pwa-install-approve', () => {
            this.deferredPrompt.prompt();
        });
    }
}
