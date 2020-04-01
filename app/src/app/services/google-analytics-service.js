export default class GoogleAnalyticsService {
  static async reportNavigationAction(view) {
    await GoogleAnalyticsService.waitForInitToFinish();
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

  static async init() {
    const apiKey = process.env.GOOGLE_ANALYTICS_CODE || window.GOOGLE_ANALYTICS_CODE;
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${apiKey}`;
    script.async = true;
    document.body.appendChild(script);

    await GoogleAnalyticsService.waitForScriptImport();
    window.dataLayer = window.dataLayer || [];

    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());

    window.gtag('config', apiKey);
    GoogleAnalyticsService.initFinished = true;
  }

  /**
   * Make sure that the imported gtag script is imported.
   * Resolve promise after import is finished
   * Reject promise after 10 retries == 5sec
   *
   * @returns {Promise<unknown>}
   */
  static waitForScriptImport() {
    return new Promise((resolve, reject) => {
      (function checkForScript(iteration) {
        if (window.dataLayer) {
          return resolve();
        }
        if (iteration > 10) {
          return reject();
        }
        return setTimeout(() => checkForScript(iteration + 1), 500);
      })(1);
    });
  }

  static waitForInitToFinish() {
    return new Promise(resolve => {
      (function checkForInitFinish() {
        if (GoogleAnalyticsService.initFinished) return resolve();
        return setTimeout(checkForInitFinish, 500);
      })();
    });
  }
}
