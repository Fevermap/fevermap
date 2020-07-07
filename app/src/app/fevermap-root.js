import { LitElement, html } from 'lit-element';
import './views/fevermap-landing.js';
import './views/fevermap-stats.js';
import './views/fevermap-data-entry.js';
import './views/fevermap-data-view.js';
import './components/fevermap-navigation.js';
import './components/material-icon.js';
import './components/language-controller.js';
import './components/dialog.js';
import './components/button.js';
import './components/development-mode-banner.js';
import AccessibilityUtil from './util/accessibility-util.js';
import './components/language-choose-dialog.js';
import './components/closing-notification.js';

class FevermapRoot extends LitElement {
  static get properties() {
    return {
      hasSubmittedAtLeastOnce: { type: Boolean },
    };
  }

  constructor() {
    super();
    const hasSubmitted = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
    this.hasSubmittedAtLeastOnce = hasSubmitted != null;
  }

  firstUpdated() {
    AccessibilityUtil.init();
    const preferredLangHasBeenSet = localStorage.getItem('PREFERRED_LANGUAGE');
    if (!preferredLangHasBeenSet) {
      const languageChooseDialog = document.createElement('language-choose-dialog');
      document.body.appendChild(languageChooseDialog);
    }
  }

  render() {
    return html`
      <language-controller></language-controller>
      <closing-notification></closing-notification>
      ${this.hasSubmittedAtLeastOnce
        ? html` <fevermap-data-view></fevermap-data-view> `
        : html` <fevermap-landing></fevermap-landing> `}
      <fevermap-navigation
        currentView="${this.hasSubmittedAtLeastOnce ? 'fevermap-data-view' : 'fevermap-landing'}"
      ></fevermap-navigation>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-root')) {
  customElements.define('fevermap-root', FevermapRoot);
}
