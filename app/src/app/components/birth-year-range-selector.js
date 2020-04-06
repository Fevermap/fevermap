import { LitElement, html } from 'lit-element';

export default class BirthYearRangeSelector extends LitElement {
  static get properties() {
    return {
      label: { type: String },
      selected: { type: Boolean },
      value: { type: String },
    };
  }

  handleSelection() {
    this.dispatchEvent(
      new CustomEvent('birth-year-selected', {
        detail: { birthYear: this.value },
      }),
    );
  }

  render() {
    return html`
      <div
        class="birth-year-range-selector${this.selected
          ? ' birth-year-range-selector--selected'
          : ''} mdc-elevation--z2"
        @click="${this.handleSelection}"
      >
        <p>${this.label}</p>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('birth-year-range-selector')) {
  customElements.define('birth-year-range-selector', BirthYearRangeSelector);
}
