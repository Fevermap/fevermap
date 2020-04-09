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

  static getBirthYearRanges() {
    return [
      { name: '1900-1909', value: '1900' },
      { name: '1910-1919', value: '1910' },
      { name: '1920-1929', value: '1920' },
      { name: '1930-1939', value: '1930' },
      { name: '1940-1949', value: '1940' },
      { name: '1950-1959', value: '1950' },
      { name: '1960-1969', value: '1960' },
      { name: '1970-1979', value: '1970' },
      { name: '1980-1989', value: '1980' },
      { name: '1990-1999', value: '1990' },
      { name: '2000-2009', value: '2000' },
      { name: '2010-2019', value: '2010' },
    ];
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
