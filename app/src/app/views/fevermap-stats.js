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
                    <div class="stats-placeholder">
                        <p>
                            Please visit <a href="https://gitlab.com/fevermap/fevermap">gitlab.com/fevermap</a> if you
                            want to contribute in developing the analytics and statistics view.
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
