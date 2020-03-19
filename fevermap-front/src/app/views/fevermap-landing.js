import { LitElement, html, css } from 'lit-element';
import Translator from '../util/translator';
import logoImg from 'src/assets/images/logo.png';
import Dialog from '../components/dialog';

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

    firstUpdated(_changedProperties) {}

    render() {
        return html`
            <div class="container view-wrapper">
                <div class="fevermap-landing-content">
                    <img src="${logoImg}" />
                    <div class="about mb-4">
                        <h2>${Translator.get('landing.about')}</h2>
                        <p>
                            <b>${Translator.get('fevermap_title')}</b> ${Translator.get(
                                'landing.about_content_explanation'
                            )}
                        </p>
                        <p>
                            ${Translator.get('landing.about_current_methods')}
                        </p>
                        <p>${Translator.get('landing.about_motivation')}</p>
                        <p>
                            ${Translator.get('landing.about_data_collection')}
                        </p>
                        <p class="participant-count-subtitle">
                            ${Translator.get('landing.about_current_participant_count', {
                                participantCount: this.currentParticipantCount,
                            })}
                        </p>
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
