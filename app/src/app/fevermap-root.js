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
  }

  render() {
    return html`
      ${window.location.origin.includes('dev') || window.location.origin.includes('localhost')
        ? html`
            <development-mode-banner></development-mode-banner>
          `
        : ''}
      <language-controller></language-controller>
      ${this.hasSubmittedAtLeastOnce
        ? html`
            <fevermap-data-view></fevermap-data-view>
          `
        : html`
            <fevermap-landing></fevermap-landing>
          `}
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
