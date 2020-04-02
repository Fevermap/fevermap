import * as firebase from 'firebase/app';
import 'firebase/messaging';
import Dialog from '../components/dialog.js';
import Translator from '../util/translator.js';

export default class NotificationService {
  static requestNotificationPermissions() {
    Notification.requestPermission(status => {
      console.log(`Notification status: ${status}`);
      if (status === 'granted') {
        NotificationService.subscribeUserToTopic();
      }
    });
  }

  static createNotificationRequestDialog() {
    if (Notification.permission === 'granted') {
      NotificationService.subscribeUserToTopic();
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

  static initFirebase(reg) {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: 'AIzaSyCPAiiuIPv0-0gEn_6kjjBBJt8DUasgo6M',
      authDomain: 'fevermap-95d71.firebaseapp.com',
      databaseURL: 'https://fevermap-95d71.firebaseio.com',
      projectId: 'fevermap-95d71',
      storageBucket: 'fevermap-95d71.appspot.com',
      messagingSenderId: '825429781563',
      appId: '1:825429781563:web:3ff8c7f6e4bbf23c10c01e',
      measurementId: 'G-3X5E6RLZBN',
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging();
    messaging.usePublicVapidKey(
      'BPv6qlHh5D9NvPbV6NYE8PyyaxneISngPL6QSGKAvuyuVoPrXx8PMy_zJpXOXCL52VN1iDTlVOdm7jY9ehcfuK8',
    );
    messaging.useServiceWorker(reg);

    NotificationService._messaging = messaging;
  }

  static async subscribeUserToTopic() {
    if (Notification.permission === 'denied') {
      return;
    }
    await NotificationService.waitForMessagingInit();
    const messaging = NotificationService._messaging;
    messaging.getToken().then(currentToken => {
      if (currentToken) {
        console.log('Current token: ', currentToken);
        const topic = `UTC${new Date().getTimezoneOffset()}`;
        fetch('http://localhost:9001/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationToken: currentToken, topic }),
        });
      } else {
        console.log('Ask for permissions');
      }
    });

    messaging.onTokenRefresh(() => {
      messaging.getToken().then(refreshedToken => {
        console.log('Token refreshed', refreshedToken);
      });
    });
  }

  static waitForMessagingInit() {
    return new Promise(resolve => {
      (function checkForMessagingInit() {
        if (NotificationService._messaging) return resolve();
        return setTimeout(checkForMessagingInit, 100);
      })();
    });
  }
}
