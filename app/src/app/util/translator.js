/* eslint-disable camelcase */
import Polyglot from 'node-polyglot';
/* Split each translation into a separate file for easier source code management */

import translation_en from '../../assets/language/en.json';
import translation_fi from '../../assets/language/fi.json';
import translation_sv from '../../assets/language/sv.json';
import translation_it from '../../assets/language/it.json';
import translation_de from '../../assets/language/de.json';
import translation_cn from '../../assets/language/cn.json';
import translation_es from '../../assets/language/es.json';
import translation_fr from '../../assets/language/fr.json';
import translation_ru from '../../assets/language/ru.json';
import translation_uk from '../../assets/language/uk.json';
import translation_be from '../../assets/language/be.json';
import translation_ar from '../../assets/language/ar.json';
import translation_pl from '../../assets/language/pl.json';
import translation_ga from '../../assets/language/ga.json';
import translation_ja from '../../assets/language/ja.json';

const translations = {
  en: translation_en,
  fi: translation_fi,
  sv: translation_sv,
  it: translation_it,
  de: translation_de,
  cn: translation_cn,
  es: translation_es,
  fr: translation_fr,
  ru: translation_ru,
  uk: translation_uk,
  be: translation_be,
  ar: translation_ar,
  pl: translation_pl,
  ga: translation_ga,
  ja: translation_ja,
};

export default class Translator {
  static getLang() {
    return { key: Translator.lang, name: Translator.get('lang_name') };
  }

  static getPossibleLanguages() {
    return Object.keys(translations).map(langKey => ({
      key: langKey,
      name: translations[langKey].lang_name,
    }));
  }

  static setLang(lang) {
    Translator.lang = lang ? lang.toLowerCase() : 'en';
    // Set fallback language based on current language
    Translator.fallback = Translator.lang === 'en' ? null : 'en';
    Translator._loadPhrases();
    if (typeof document !== 'undefined') {
      document.querySelector('html').setAttribute('lang', lang ? lang.toLowerCase() : 'en');
    }
  }

  static _loadPhrases() {
    Translator.polyglot = new Polyglot({
      phrases: translations,
      onMissingKey: (key, params) => {
        if (!key || !Translator.fallback || key.startsWith(Translator.fallback)) {
          // Return key as last resort if there's no fallback or this is the fallback language
          return key;
        }
        const fallbackKey = Translator.fallback + key.substr(key.indexOf('.'));
        return Translator.polyglot.t(fallbackKey, params);
      },
    });
  }

  static get(word, params) {
    if (!Translator.polyglot) {
      Translator.setLang('en');
    }
    return Translator.polyglot.t(`${this.lang}.${word}`, params);
  }
}
