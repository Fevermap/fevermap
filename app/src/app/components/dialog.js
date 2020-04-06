import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCDialog } from '@material/dialog/component';
import tabtrap from 'tabtrap';

export default class Dialog extends LitElement {
  static get properties() {
    return {
      dialogTitle: { type: String },
      dialogContent: { type: String },
      dialogApproveText: { type: String },
      dialogApproveEvent: { type: String },
      dialogDeclineText: { type: String },
      dialogDeclineEvent: { type: String },
      elem: { type: Object },

      oldFocusElem: { type: Object },
    };
  }

  constructor() {
    super();
    this.dialogTitle = '';
    this.dialogContent = '';
    this.dialogApproveText = '';
    this.dialogDeclineText = '';
    this.dialogApproveEvent = '';
    this.dialogDeclineEvent = '';
    this.elem = null;
  }

  firstUpdated() {
    this.oldFocusElem = document.activeElement;
    this.elem = new MDCDialog(this.querySelector('.mdc-dialog'));
    this.elem.open();

    this.elem.listen('MDCDialog:closed', e => {
      if (e.detail.action === 'yes') {
        document.dispatchEvent(new CustomEvent(this.dialogApproveEvent));
      }
      if (this.oldFocusElem) {
        this.oldFocusElem.focus();
      }
    });
  }

  static open(options) {
    const dialog = document.createElement('dialog-window');
    dialog.setAttribute('dialogTitle', options.title);
    dialog.setAttribute('dialogContent', options.content);
    dialog.setAttribute('dialogApproveText', options.approveText);
    dialog.setAttribute('dialogApproveEvent', options.approveEvent);
    dialog.setAttribute('dialogDeclineText', options.declineText);
    dialog.setAttribute('dialogDeclineEvent', options.declineEvent);

    document.body.appendChild(dialog);
    setTimeout(() => {
      dialog.focus();
      tabtrap.trapAll(dialog.querySelector('.mdc-dialog'));
    });
  }

  render() {
    return html`
      <div class="mdc-dialog">
        <div class="mdc-dialog__container">
          <div
            class="mdc-dialog__surface"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="my-dialog-title"
            aria-describedby="my-dialog-content"
          >
            <h2 class="mdc-dialog__title" id="my-dialog-title">${this.dialogTitle}</h2>
            <div class="mdc-dialog__content" id="my-dialog-content">
              ${this.dialogContent}
            </div>
            <footer class="mdc-dialog__actions">
              <button
                type="button"
                class="mdc-button mdc-dialog__button"
                data-mdc-dialog-action="no"
              >
                <div class="mdc-button__ripple"></div>
                <span class="mdc-button__label">${this.dialogDeclineText}</span>
              </button>
              <button
                type="button"
                class="mdc-button mdc-dialog__button"
                data-mdc-dialog-action="yes"
              >
                <div class="mdc-button__ripple"></div>
                <span class="mdc-button__label">${this.dialogApproveText}</span>
              </button>
            </footer>
          </div>
        </div>
        <div class="mdc-dialog__scrim"></div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('dialog-window')) {
  customElements.define('dialog-window', Dialog);
}
