import polyglot from 'node-polyglot';

/* Split each translation into a separate file for easier source code management */
import translation_en from 'assets/language/en';
import translation_fi from 'assets/language/fi';
import translation_sv from 'assets/language/sv';
import translation_it from 'assets/language/it';
import translation_de from 'assets/language/de';
import translation_cn from 'assets/language/cn';
import translation_es from 'assets/language/es';

const translations = {
    en: translation_en,
    fi: translation_fi,
    sv: translation_sv,
    it: translation_it,
    de: translation_de,
    cn: translation_cn,
    es: translation_es,
};

export default class Translator {
    static getLang() {
        return { key: Translator.lang, name: Translator.get('lang_name') };
    }

    static getPossibleLanguages() {
        return Object.keys(translations).map(langKey => ({ key: langKey, name: translations[langKey].lang_name }));
    }

    static setLang(lang) {
        Translator.lang = lang ? lang.toLowerCase() : 'en';
        Translator._loadPhrases();
        document.querySelector('html').setAttribute('lang', lang ? lang.toLowerCase() : 'en');
    }

    static _loadPhrases() {
        Translator.polyglot = new polyglot({ phrases: translations });
    }

    static get(word, params) {
        if (!Translator.polyglot) {
            Translator.setLang('en');
        }
        return Translator.polyglot.t(`${this.lang}.${word}`, params);
    }
}
