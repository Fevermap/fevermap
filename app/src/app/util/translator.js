/* eslint-disable camelcase */
import Polyglot from 'node-polyglot';

/* Split each translation into a separate file for easier source code management */
import translation_ar from '../../assets/language/ar.json';
import translation_be from '../../assets/language/be.json';
import translation_cn from '../../assets/language/cn.json';
import translation_ca from '../../assets/language/ca.json';
import translation_de from '../../assets/language/de.json';
import translation_en from '../../assets/language/en.json';
import translation_es from '../../assets/language/es.json';
import translation_fi from '../../assets/language/fi.json';
import translation_fr from '../../assets/language/fr.json';
import translation_ga from '../../assets/language/ga.json';
import translation_hu from '../../assets/language/hu.json';
import translation_it from '../../assets/language/it.json';
import translation_ja from '../../assets/language/ja.json';
import translation_nl from '../../assets/language/nl.json';
import translation_no from '../../assets/language/no.json';
import translation_pl from '../../assets/language/pl.json';
import translation_ru from '../../assets/language/ru.json';
import translation_sv from '../../assets/language/sv.json';
import translation_th from '../../assets/language/th.json';
import translation_uk from '../../assets/language/uk.json';
import translation_pt from '../../assets/language/pt.json';
import translation_cs from '../../assets/language/cs.json';

const translations = {
  ar: translation_ar,
  be: translation_be,
  ca: translation_ca,
  cn: translation_cn,
  cs: translation_cs,
  de: translation_de,
  en: translation_en,
  es: translation_es,
  fi: translation_fi,
  fr: translation_fr,
  ga: translation_ga,
  hu: translation_hu,
  it: translation_it,
  ja: translation_ja,
  nl: translation_nl,
  no: translation_no,
  pl: translation_pl,
  ru: translation_ru,
  sv: translation_sv,
  th: translation_th,
  uk: translation_uk,
  pt: translation_pt,
};

export default class Translator {
  static getLang() {
    return { key: Translator.lang, name: Translator.get('lang_name') };
  }

  static getLangObject(langKey) {
    if (!translations[langKey]) return false;
    return {
      key: langKey,
      name: translations[langKey].lang_name,
    };
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

  static isTranslated(word) {
    return Translator.polyglot.has(`${this.lang}.${word}`);
  }
}
