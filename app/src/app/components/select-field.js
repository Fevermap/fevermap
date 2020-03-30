import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCSelect } from '@material/select/component';

class SelectField extends LitElement {
  static get properties() {
    return {
      options: { type: Array },
      selectedValue: { type: Object },
      selectedValueIndex: { type: Number },
      elem: { type: Object },
      label: { type: String },
    };
  }

  constructor() {
    super();
    this.label = '';
    this.options = [];
    this.selectedValue = null;
    this.selectedValueIndex = 0;
    this.elem = null;
  }

  firstUpdated() {
    const selectElem = this.querySelector('.mdc-select');
    this.elem = new MDCSelect(selectElem);

    this.elem.listen('MDCSelect:change', () => {
      this.dispatchEvent(
        new CustomEvent('select-change', {
          detail: {
            index: this.elem.selectedIndex,
            value: this.options[this.elem.selectedIndex - 1],
          },
        }),
      );
    });
  }

  updated(_changedProperties) {
    if (_changedProperties.has('selectedValueIndex')) {
      this.elem.selectedIndex = this.selectedValueIndex;
    }
  }

  getValue() {
    return { index: this.elem.selectedIndex, value: this.options[this.elem.selectedIndex - 1] };
  }

  render() {
    return html`
      <div class="mdc-select">
        <div class="mdc-select__anchor fevermap-select-width-class">
          <i class="mdc-select__dropdown-icon"></i>
          <div class="mdc-select__selected-text"></div>
          <span class="mdc-floating-label">${this.label}</span>
          <div class="mdc-line-ripple"></div>
        </div>

        <div class="mdc-select__menu mdc-menu mdc-menu-surface fevermap-select-width-class">
          <ul class="mdc-list">
            <li
              class="mdc-list-item mdc-list-item--selected"
              data-value=""
              aria-selected="true"
            ></li>
            ${this.options.map(
              opt => html`
                <li class="mdc-list-item" data-value="${opt.name.toLowerCase()}">${opt.name}</li>
              `,
            )}
          </ul>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('select-field')) {
  customElements.define('select-field', SelectField);
}
