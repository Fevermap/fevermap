import { LitElement, html } from 'lit-element';
import Translator from '../util/translator';

class DevelopmentModeBanner extends LitElement {
    render() {
        return html`
            <div class="dev-mode-banner"><p>${Translator.get('dev_mode_banner_disclaimer')}</p></div>
        `;
    }

    createRenderRoot() {
        return this;
    }
}

if (!customElements.get('development-mode-banner')) {
    customElements.define('development-mode-banner', DevelopmentModeBanner);
}
