import { LitElement, html } from 'lit-element';

class Button extends LitElement {
  static get properties() {
    return {
      icon: { type: String },
      label: { type: String },
    };
  }

  handleClick(e) {
    this.dispatchEvent(new CustomEvent('button-clicked', e));
  }

  render() {
    return html`
      <div>
        <button class="mdc-button mdc-button--raised" @click="${this.handleClick}">
          <div class="mdc-button__ripple"></div>

          <i class="material-icons mdc-button__icon" aria-hidden="true">${this.icon}</i>
          <span class="mdc-button__label">${this.label}</span>
        </button>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('material-button')) {
  customElements.define('material-button', Button);
}
