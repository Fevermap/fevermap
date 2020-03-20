import { LitElement, html, css } from 'lit-element';
import Translator from '../util/translator';

class FevermapStats extends LitElement {
    static get properties() {
        return {};
    }

    static get styles() {
        return [];
    }

    constructor() {
        super();
    }

    firstUpdated(_changedProperties) {}

    render() {
        return html`
            <div class="container view-wrapper">
                <div class="fevermap-stats-content">
                    <h1>${Translator.get('stats.stats')}</h1>
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
