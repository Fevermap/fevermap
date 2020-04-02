import { LitElement, html } from 'lit-element';
import shareImage from '../../assets/images/share-apple.png';

class IosPwaInstallPrompt extends LitElement {
  firstUpdated() {
    setTimeout(() => {
      const wrapper = this.querySelector('.ios-pwa-install-prompt--wrapper');
      wrapper.classList.remove('ios-pwa-install-prompt--wrapper__hidden');
      wrapper.addEventListener('click', () => this.remove());
    }, 100);
  }

  render() {
    return html`
      <div class="ios-pwa-install-prompt--wrapper ios-pwa-install-prompt--wrapper__hidden">
        <div class="ios-pwa-install-prompt--arrow mdc-elevation--z3"></div>
        <div class="ios-pwa-install-prompt mdc-elevation--z3">
          <img src="${shareImage}" />
          <p>
            To install Fevermap on your device, press the share button and then "Add to homescreen"
          </p>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('ios-pwa-install-prompt')) {
  customElements.define('ios-pwa-install-prompt', IosPwaInstallPrompt);
}
