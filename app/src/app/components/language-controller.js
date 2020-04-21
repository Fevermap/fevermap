/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';
import ServiceWorkerService from '../services/service-worker-service.js';

class LanguageController extends LitElement {
  static get properties() {
    return {
      visible: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.setLang();
    this.visible = true;
  }

  firstUpdated() {
    document.body.addEventListener('scroll', () => {
      this.visible = document.body.scrollTop <= 0;
    });
  }

  setLang() {
    const setLangInStorage = localStorage.getItem('USER_SET_LANG');
    let lang = setLangInStorage || navigator.language;
    if (lang.includes('-')) {
      lang = [...lang.split('-')[0]];
    }
    if (
      !Translator.getPossibleLanguages()
        .map(l => l.key)
        .includes(lang)
    ) {
      // console.error(`Lang ${lang} not found. Defaulting to English.`);
      lang = 'en';
    }
    Translator.getPossibleLanguages();
    Translator.setLang(lang);
    localStorage.setItem('USER_SET_LANG', lang);
    this.messageLanguageToSW();
  }

  handleLanguageChange(e) {
    const selectedLang = e.target.value;
    localStorage.setItem('USER_SET_LANG', selectedLang);
    Translator.setLang(selectedLang);
    window.location.reload();
  }

  messageLanguageToSW() {
    ServiceWorkerService.sendMessage({
      type: 'SET_LANGUAGE',
      LANGUAGE: Translator.getLang(),
    });
  }

  render() {
    return html`
      <div class="language-switcher${this.visible ? '' : ' language-switcher--hidden'}">
        <p>${Translator.get('language')}</p>
        <select id="language-selector" @change="${this.handleLanguageChange}" tabindex="0"
          ><option value="${Translator.getLang().key}">${Translator.getLang().name}</option>
          ${Translator.getPossibleLanguages().map(lang => {
            if (lang.key === Translator.lang) {
              return '';
            }
            return html` <option value="${lang.key}">${lang.name}</option> `;
          })}</select
        >
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('language-controller')) {
  customElements.define('language-controller', LanguageController);
}
