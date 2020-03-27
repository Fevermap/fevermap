export default class GoogleAnalyticsService {
    static reportNavigationAction(view) {
        gtag('event', 'navigation', {
            event_category: 'in-app-navigation',
            event_label: view,
        });
    }

    static reportSubmission() {
        gtag('event', 'submit', {
            event_category: 'successful',
        });
    }

    static reportTooEarlySubmission() {
        gtag('event', 'submit', {
            event_category: 'too early',
        });
    }
}
