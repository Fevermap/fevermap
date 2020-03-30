import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCTextField } from '@material/textfield/component';

class InputField extends LitElement {
  static get properties() {
    return {
      placeHolder: { type: String },
      fieldId: { type: String },
      value: { type: String },
      elem: { type: Object },
      disabled: { type: Boolean },
      type: { type: String },
    };
  }

  constructor() {
    super();
    this.placeHolder = '';
    this.fieldId = '';
    this.value = '';
    this.elem = null;
    this.disabled = false;
    this.type = 'text';
  }

  firstUpdated() {
    this.elem = new MDCTextField(this.querySelector('.mdc-text-field'));
  }

  updated(_changedProperties) {
    if (_changedProperties.has('value') && this.value) {
      // Handle blur on updated values, so that the placeholder text labels
      // raise above the value instead of overlapping
      this.elem.getDefaultFoundation().inputBlurHandler_();
    }
  }

  getValue() {
    return this.elem.getDefaultFoundation().getValue();
  }

  setValue(value) {
    if (this.elem) {
      this.elem.getDefaultFoundation().setValue(value);
    }
  }

  handleBlur() {
    this.dispatchEvent(
      new CustomEvent('input-blur', {
        detail: { age: this.elem.getDefaultFoundation().getValue() },
      }),
    );
  }

  render() {
    return html`
      <label class="mdc-text-field${this.disabled ? ' mdc-text-field--disabled' : ''}">
        <div class="mdc-text-field__ripple"></div>
        <input
          class="mdc-text-field__input"
          type="${this.type}"
          aria-labelledby="${this.fieldId}"
          .value="${this.value}"
          ?disabled="${this.disabled}"
          @blur="${this.handleBlur}"
        />
        <span class="mdc-floating-label" id="${this.fieldId}">${this.placeHolder}</span>
        <div class="mdc-line-ripple"></div>
      </label>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('input-field')) {
  customElements.define('input-field', InputField);
}
