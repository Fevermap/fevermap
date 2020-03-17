import { LitElement, html } from 'lit-element';
import 'src/app/views/fevermap-landing';
import 'src/app/views/fevermap-stats';
import 'src/app/views/fevermap-data-entry';
import 'src/app/components/fevermap-navigation';
import 'src/app/components/material-icon';
import 'src/app/components/language-controller';
import Translator from './util/translator';

class FevermapRoot extends LitElement {
    static get properties() {
        return {};
    }

    render() {
        return html`
            <language-controller></language-controller>
            <fevermap-landing></fevermap-landing>
            <fevermap-navigation currentView="fevermap-landing"></fevermap-navigation>
        `;
    }
    createRenderRoot() {
        return this;
    }
}

if (!customElements.get('fevermap-root')) {
    customElements.define('fevermap-root', FevermapRoot);
}
