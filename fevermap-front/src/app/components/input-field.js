import { LitElement, html } from 'lit-element';
import { MDCTextField } from '@material/textfield/component';

class InputField extends LitElement {
    static get properties() {
        return {
            placeHolder: { type: String },
            fieldId: { type: String },
            value: { type: String },
            elem: { type: Object },
            disabled: { type: Boolean },
        };
    }

    constructor() {
        super();
        this.placeHolder = '';
        this.fieldId = '';
        this.value = '';
        this.elem = null;
        this.disabled = false;
    }

    firstUpdated(_changedProperties) {
        this.elem = new MDCTextField(this.querySelector('.mdc-text-field'));
    }

    updated(_changedProperties) {
        if (_changedProperties.has('value') && this.value) {
            // Handle blur on updated values, so that the placeholder text labels
            // raise above the value instead of overlapping
            this.elem.getDefaultFoundation().inputBlurHandler_();
            this.elem.getDefaultFoundation().setValue(this.value);
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

    handleBlur(e) {
        this.dispatchEvent(new CustomEvent('input-blur', e));
    }

    render() {
        return html`
            <label class="mdc-text-field${this.disabled ? ' mdc-text-field--disabled' : ''}">
                <div class="mdc-text-field__ripple"></div>
                <input
                    class="mdc-text-field__input"
                    type="text"
                    aria-labelledby="${this.fieldId}"
                    value="${this.value}"
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
