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
      menuElem: { type: Object },
      selectedText: { type: Object },
      label: { type: String },

      isOpen: { type: Boolean },
      inputListenerSet: { type: Boolean },
      typedCharacters: { type: String },
    };
  }

  constructor() {
    super();
    this.label = '';
    this.options = [];
    this.selectedValue = null;
    this.selectedValueIndex = 0;
    this.elem = null;
    this.menuElem = null;
    this.selectedText = null;

    this.inputListenerSet = false;
    this.typedCharacters = '';
  }

  firstUpdated() {
    const selectElem = this.querySelector('.mdc-select');
    this.elem = new MDCSelect(selectElem);
    this.menuElem = this.elem.menu_;
    this.selectedText = this.querySelector('.mdc-select__selected-text');
    const handleKeyboardInputEventHandler = e => this.handleKeyboardInput(e);
    this.menuElem.listen('MDCMenuSurface:opened', () => {
      if (!this.inputListenerSet) {
        window.addEventListener('keydown', handleKeyboardInputEventHandler);
        this.inputListenerSet = true;
      }
    });
    this.elem.menu_.listen('MDCMenuSurface:closed', () => {
      if (this.inputListenerSet) {
        window.removeEventListener('keydown', handleKeyboardInputEventHandler);
        this.inputListenerSet = false;
        this.typedCharacters = '';
      }
    });
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

  handleKeyboardInput(e) {
    if (e.key === 'Backspace') {
      this.typedCharacters = this.typedCharacters.substring(0, this.typedCharacters.length - 1);
      return;
    }
    if (!/[a-zöäå]/i.test(e.key) || e.key.length > 1) {
      return;
    }
    this.typedCharacters += e.key;
    const regex = new RegExp(`^${this.typedCharacters}`, 'i');
    const foundEntry = this.options.find(entry => entry.name.match(regex));
    if (foundEntry) {
      const foundEntryIndex = this.options.indexOf(foundEntry);
      this.menuElem.list_.getDefaultFoundation().adapter_.focusItemAtIndex(foundEntryIndex + 1);
    }
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
