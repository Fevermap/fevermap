import Dialog from '../components/dialog.js';
import Translator from '../util/translator.js';

export default class PWAService {
  static init(deferredPrompt) {
    if (!deferredPrompt) {
      return;
    }
    PWAService._instance = new PWAService(deferredPrompt);
  }

  static installable() {
    return typeof PWAService._instance !== 'undefined';
  }

  static launchInstallDialog() {
    if (!PWAService._instance) {
      return;
    }
    PWAService._instance.openInstallDialog();
  }

  constructor(deferredPrompt) {
    this.deferredPrompt = deferredPrompt;
    this.hasPromptedInstallDialog = false;
  }

  openInstallDialog() {
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
