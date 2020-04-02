/* eslint-disable class-methods-use-this */
import Dialog from '../components/dialog.js';
import Translator from '../util/translator.js';

export default class PWAService {
  static init(deferredPrompt) {
    if (!deferredPrompt) {
      return;
    }
    PWAService._instance = new PWAService(deferredPrompt);
  }

  /**
   * PWAService._instance is initialized, if a install prompt has
   * been caught and deferred.
   *
   * However on iOS, this prompt is not launched, so we need to check on iOS devices
   * if the device is an iOS device and if it's already running PWA
   *
   * @returns Is the page installable as a PWA
   */
  static installable() {
    return (
      typeof PWAService._instance !== 'undefined' ||
      (PWAService.isIos() && !PWAService.isInStandaloneMode())
    );
  }

  static launchInstallDialog() {
    if (!PWAService._instance) {
      return;
    }
    if (PWAService.isIos()) {
      PWAService._instance.openIosDialog();
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

  openIosDialog() {
    const iosBanner = document.createElement('ios-pwa-install-prompt');
    document.body.append(iosBanner);
  }

  // Detects if the device is a iOS device
  static isIos() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  // Detects if the device is in standalone more already
  static isInStandaloneMode() {
    return 'standalone' in window.navigator && window.navigator.standalone;
  }
}
