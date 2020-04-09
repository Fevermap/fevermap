import { LitElement, html } from 'lit-element';
import maleIcon from '../../assets/images/male.svg';
import femaleIcon from '../../assets/images/female.svg';
import Translator from '../util/translator.js';

class GenderInput extends LitElement {
  static get properties() {
    return {
      gender: { type: String },
    };
  }

  constructor() {
    super();
    this.gender = null;
  }

  changeGender(newGender) {
    this.gender = newGender;
    this.dispatchEvent(new CustomEvent('gender-changed', { detail: { gender: this.gender } }));
  }

  getValue() {
    return this.gender;
  }

  render() {
    return html`
      <div
        class="gender-input-holder mdc-elevation--z3${this.gender == null
          ? ' gender-input-holder--none-selected'
          : ''}"
      >
        <div
          tabindex="0"
          @click="${() => this.changeGender('M')}"
          class="gender-input gender-input--male${this.gender === 'M'
            ? ' gender-input--selected'
            : ''}"
        >
          <img src="${maleIcon}" />
          <p>${Translator.get('entry.questions.male')}</p>
        </div>
        <div
          tabindex="0"
          @click="${() => this.changeGender('F')}"
          class="gender-input gender-input--female${this.gender === 'F'
            ? ' gender-input--selected'
            : ''}"
        >
          <img src="${femaleIcon}" />
          <p>${Translator.get('entry.questions.female')}</p>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('gender-input')) {
  customElements.define('gender-input', GenderInput);
}
