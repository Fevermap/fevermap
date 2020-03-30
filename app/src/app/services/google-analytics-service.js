export default class GoogleAnalyticsService {
  static reportNavigationAction(view) {
    window.gtag('event', 'navigation', {
      event_category: 'in-app-navigation',
      event_label: view,
    });
  }

  static reportSubmission() {
    window.gtag('event', 'submit', {
      event_category: 'successful',
    });
  }

  static reportTooEarlySubmission() {
    window.gtag('event', 'submit', {
      event_category: 'too early',
    });
  }
}
