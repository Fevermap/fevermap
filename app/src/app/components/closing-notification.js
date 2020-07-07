import { LitElement, html } from 'lit-element';

export default class ClosingNotification extends LitElement {
  static get properties() {
    return {
      hidden: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.hidden = false;
  }

  firstUpdated() {
    this.addEventListener('click', this.hide);
  }

  hide() {
    this.hidden = true;
  }

  render() {
    return html`
      <style>
        :host {
            position: fixed;
            top: 0;
            left: 0;
            width: 80%;
            background: red;
            color: #FFF;
            z-index: 101;
            ${this.hidden ? `display: none;` : ''}
        }

        h2, p {
            margin: 0.5rem 0;
        }
      </style>
      <h2>Fevermap will be closing in July 2020</h2>
      <p>
        The Fevermap Application will be shut down at the end of July 2020. Thank you for your
        participation.
      </p>
      <p>
        If interest raises to relaunch or further develop or repurpose the application, please
        contact the team via email.
      </p>
      <p>Be safe!</p>
      <p>- The Fevermap Team</p>
    `;
  }
}

if (!customElements.get('closing-notification')) {
  customElements.define('closing-notification', ClosingNotification);
}
