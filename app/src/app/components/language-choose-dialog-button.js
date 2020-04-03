import { LitElement, html } from 'lit-element';

class LanguageChooseDialogButton extends LitElement {
  static get properties() {
    return {
      label: { type: String },
      language: { type: Object },
    };
  }

  handleLanguageSelection() {
    this.dispatchEvent(
      new CustomEvent('language-selected', { detail: { language: this.language } }),
    );
  }

  render() {
    return html`
      <div
        class="language-choose-dialog--button mdc-elevation--z3"
        @click="${this.handleLanguageSelection}"
      >
        <p>${this.label}</p>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('language-choose-dialog-button')) {
  customElements.define('language-choose-dialog-button', LanguageChooseDialogButton);
}
