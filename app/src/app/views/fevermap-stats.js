import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import GoogleAnalyticsService from '../services/google-analytics-service.js';
import VisualizationMap from '../components/visualization-map.js';

class FevermapStats extends LitElement {
  static get properties() {
    return {};
  }

  firstUpdated() {
    GoogleAnalyticsService.reportNavigationAction('Stats View');
  }

  render() {
    return html`
      <div class="container view-wrapper">
        <div class="fevermap-stats-content">
          <h1>${Translator.get('stats.stats')}</h1>
          <div class="visualization-map-container">
            ${VisualizationMap.getColorRangeElement()}

            <visualization-map></visualization-map>
          </div>
          <div class="stats-placeholder">
            <p>
              Please visit <a href="https://gitlab.com/fevermap/fevermap">gitlab.com/fevermap</a> if
              you want to contribute in developing the analytics and statistics view.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-stats')) {
  customElements.define('fevermap-stats', FevermapStats);
}
