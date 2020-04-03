import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import './language-choose-dialog-button.js';

class LanguageChooseDialog extends LitElement {
  static get properties() {
    return {
      possibleLanguages: { type: Array },
      defaultedLanguage: { type: Object },
    };
  }

  constructor() {
    super();
    this.possibleLanguages = Translator.getPossibleLanguages();
    this.defaultedLanguage = Translator.getLang();
  }

  firstUpdated() {
    setTimeout(() => {
      this.querySelector('.language-choose-dialog').classList.remove(
        'language-choose-dialog--hidden',
      );
    }, 100);
  }

  // eslint-disable-next-line class-methods-use-this
  setPreferredLang(lang) {
    localStorage.setItem('PREFERRED_LANGUAGE', lang.key);
    Translator.setLang(lang.key);
    window.location.reload();
  }

  render() {
    return html`
      <div class="language-choose-dialog language-choose-dialog--hidden">
        <div class="language-choose-dialog--window mdc-elevation--z3">
          <h1>Choose a language</h1>
          <p>
            Seems like it's your first time here. Please select the language you would like to use
            Fevermap with.
          </p>
          <p>Our system recommended us to display Fevermap in:</p>
          <language-choose-dialog-button
            @language-selected="${e => this.setPreferredLang(e.detail.language)}"
            label="${this.defaultedLanguage.name}"
            .language="${this.defaultedLanguage}"
          ></language-choose-dialog-button>
          <p>
            However if this isn't the language you would like to use Fevermap with, choose your
            preferred language below.
          </p>
          <div class="language-choose-dialog--options">
            ${this.possibleLanguages.map(
              opt =>
                html`
                  <language-choose-dialog-button
                    @language-selected="${e => this.setPreferredLang(e.detail.language)}"
                    label="${opt.name}"
                    .language="${opt}"
                  ></language-choose-dialog-button>
                `,
            )}
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('language-choose-dialog')) {
  customElements.define('language-choose-dialog', LanguageChooseDialog);
}
