import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import './language-choose-dialog-button.js';

class LanguageChooseDialog extends LitElement {
  static get properties() {
    return {
      possibleLanguages: { type: Array },
      defaultedLanguage: { type: Object },
      languageFromUri: { type: Object },
    };
  }

  constructor() {
    super();
    this.possibleLanguages = Translator.getPossibleLanguages().sort((a, b) =>
      a.name > b.name ? 1 : -1,
    );
    this.defaultedLanguage = Translator.getLang();
    this.fallbackLanguageCode = 'en';
    this.getLanguageFromUri();
  }

  getLanguageFromUri() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromURI = urlParams.get('lang');
    if (this.possibleLanguages.find(elem => elem.key === langFromURI)) {
      this.languageFromUri = this.defaultedLanguage;
      this.languageFromUri.key = langFromURI;
      this.setPreferredLang(this.languageFromUri);
    }
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
    localStorage.setItem('USER_SET_LANG', lang.key);
    Translator.setLang(lang.key);
    window.location.reload();
  }

  render() {
    return html`
      <div class="language-choose-dialog language-choose-dialog--hidden">
        <div class="language-choose-dialog--window mdc-elevation--z3">
          <h1>
            Choose a language
            ${Translator.isTranslated('entry.choose_language') &&
            this.defaultedLanguage.key !== this.fallbackLanguageCode
              ? `(${Translator.get('entry.choose_language')})`
              : ''}
          </h1>

          <!-- <p>
            Seems like it’s your first time here.
          </p> -->

          <div class="language-choose-dialog--main-options">
            <language-choose-dialog-button
              @language-selected="${e => this.setPreferredLang(e.detail.language)}"
              label="${this.defaultedLanguage.name}"
              .language="${this.defaultedLanguage}"
              highLight
            ></language-choose-dialog-button>
            ${this.defaultedLanguage.key !== this.fallbackLanguageCode
              ? html`
                  <language-choose-dialog-button
                    @language-selected="${e => this.setPreferredLang(e.detail.language)}"
                    label="${Translator.getLangObject(this.fallbackLanguageCode).name}"
                    .language="${Translator.getLangObject(this.fallbackLanguageCode)}"
                  ></language-choose-dialog-button>
                `
              : ''}
          </div>
          <p>
            We highlighted the language our system recommends for you above. If this isn’t the
            language you would like to use, choose from all available languages below.
          </p>
          <div class="language-choose-dialog--all-options">
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
