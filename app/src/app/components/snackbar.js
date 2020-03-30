import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCSnackbar } from '@material/snackbar/component';

export default class SnackBar extends LitElement {
  static get properties() {
    return {
      message: { type: String },
      timeOut: { type: Number },
      elem: { type: Object },
    };
  }

  constructor() {
    super();
    this.message = '';
    this.timeOut = 4000;
  }

  firstUpdated() {
    this.elem = new MDCSnackbar(this.querySelector('.mdc-snackbar'));
  }

  open() {
    this.elem.getDefaultFoundation().setTimeoutMs(this.timeOut ? this.timeOut : 4000);
    this.elem.open();
    this.elem.listen('MDCSnackbar:closing', () => {
      setTimeout(() => {
        this.remove();
      }, 1000);
    });
  }

  close() {
    this.elem.close();
  }

  static success(message, timeOut) {
    const snackbar = document.createElement('snackbar-elem');
    snackbar.setAttribute('message', message);
    if (timeOut) {
      snackbar.setAttribute('timeOut', timeOut);
    }
    document.body.appendChild(snackbar);
    setTimeout(() => {
      snackbar.open();
    });
  }

  static error(message, timeOut) {
    const snackbar = document.createElement('snackbar-elem');
    snackbar.setAttribute('message', message);
    if (timeOut) {
      snackbar.setAttribute('timeOut', timeOut);
    }
    document.body.appendChild(snackbar);
    setTimeout(() => {
      snackbar.querySelector('.mdc-snackbar').classList.add('mdc-snackbar--error');
      snackbar.open();
    });
  }

  render() {
    return html`
      <div class="mdc-snackbar" @click="${this.close}">
        <div class="mdc-snackbar__surface">
          <div class="mdc-snackbar__label" role="status" aria-live="polite">
            ${this.message}
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('snackbar-elem')) {
  customElements.define('snackbar-elem', SnackBar);
}
