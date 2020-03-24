import { LitElement, html } from 'lit-element';
import 'src/app/views/fevermap-landing';
import 'src/app/views/fevermap-stats';
import 'src/app/views/fevermap-data-entry';
import 'src/app/views/fevermap-data-view';
import 'src/app/components/fevermap-navigation';
import 'src/app/components/material-icon';
import 'src/app/components/language-controller';
import 'src/app/components/dialog';
import 'src/app/components/button';
import 'src/app/components/development-mode-banner';

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
