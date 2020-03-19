import Dialog from '../components/dialog';
import Translator from '../util/translator';

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
            title: Translator.get('dialog.pwa_installer.title'),
            content: Translator.get('dialog.pwa_installer.content'),
            approveText: Translator.get('dialog.pwa_installer.approve_text'),
            declineText: Translator.get('dialog.pwa_installer.decline_text'),
            approveEvent: 'pwa-install-approve',
            declineEvent: 'pwa-install-decline',
        });
        this.hasPromptedInstallDialog = true;
        document.addEventListener('pwa-install-approve', () => {
            this.deferredPrompt.prompt();
        });
    }
}
