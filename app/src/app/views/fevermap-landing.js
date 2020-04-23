import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import logoImg from '../../assets/images/landing-logo.png';
import DataEntryService from '../services/data-entry-service.js';
import GoogleAnalyticsService from '../services/google-analytics-service.js';
import PWAService from '../services/pwa-service.js';
import '../components/ios-pwa-install-prompt.js';

class FevermapLanding extends LitElement {
  static get properties() {
    return {
      currentParticipantCount: { type: Number },
    };
  }

  static get styles() {
    return [];
  }

  constructor() {
    super();
    this.currentParticipantCount = 0;
  }

  firstUpdated() {
    this.getCurrentStats();
    GoogleAnalyticsService.reportNavigationAction('About View');
  }

  async getCurrentStats() {
    const stats = await DataEntryService.getStats();
    this.currentParticipantCount = stats ? stats.data.submitters.total : 0;
  }

  render() {
    return html`
      <div class="container view-wrapper">
        <div class="fevermap-landing-content">
          <a href="https://fevermap.net"><img src="${logoImg}" /></a>
          ${PWAService.installable()
            ? html`
                <material-button
                  class="install-button"
                  label="Download app"
                  icon="play_for_work"
                  @click="${() => {
                    PWAService.launchInstallDialog();
                  }}"
                ></material-button>
              `
            : ''}
          <div class="about mb-4">
            <h2>${Translator.get('landing.about_title')}</h2>
            <p>
              <b>${Translator.get('fevermap_title')}</b> ${Translator.get(
                'landing.about_content_explanation',
              )}
            </p>
            <p>
              ${Translator.get('landing.about_current_methods')}
            </p>
            <p>${Translator.get('landing.about_solution')}</p>
            <p>
              ${Translator.get('landing.about_data_collection')}
            </p>
            ${this.currentParticipantCount > 2000
              ? html`
                  <p class="participant-count-subtitle">
                    ${Translator.get('landing.about_current_participant_count', {
                      participantCount: this.currentParticipantCount,
                    })}
                  </p>
                `
              : ''}
          </div>
          <div class="participation mb-4">
            <h2>${Translator.get('landing.how_to_participate')}</h2>
            <p>
              ${Translator.get('landing.participation_info')}
            </p>
            <p>
              ${Translator.get('landing.info_disclaimer')}
            </p>
          </div>
          <div class="data-use">
            <h2>${Translator.get('landing.how_will_my_data_be_used')}</h2>
            <p>${Translator.get('landing.data_use_explanation')}</p>
          </div>
          <a href="https://fevermap.net">>> Fevermap.net</a>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-landing')) {
  customElements.define('fevermap-landing', FevermapLanding);
}
