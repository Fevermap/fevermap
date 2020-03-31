import Dialog from '../components/dialog.js';
import Translator from '../util/translator.js';

export default class NotificationService {
  static requestNotificationPermissions() {
    Notification.requestPermission(status => {
      console.log(`Notification status: ${status}`);
    });
  }

  static createNotificationRequestDialog() {
    if (Notification.permission === 'granted') {
      return;
    }
    Dialog.open({
      title: Translator.get('dialog.notifications.title'),
      content: Translator.get('dialog.notifications.content'),
      approveText: Translator.get('dialog.notifications.approve_text'),
      declineText: Translator.get('dialog.notifications.decline_text'),
      approveEvent: 'notifications-approve',
      declineEvent: 'notifications-decline',
    });
    document.addEventListener('notifications-approve', () => {
      NotificationService.requestNotificationPermissions();
    });
    document.addEventListener('notifications-decline', () => {
      Notification.permission = 'denied';
    });
  }
}
