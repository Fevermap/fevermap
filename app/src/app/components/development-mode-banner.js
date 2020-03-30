import { LitElement, html } from 'lit-element';

class DevelopmentModeBanner extends LitElement {
  /*
   * The development mode banner does not need to be translated as it is only
   * for beta testers, not actual end users.
   */
  render() {
    return html`
      <div class="dev-mode-banner">
        <p>
          DEV MODE: Data will not be permanent. Report bugs at
          <a href="https://gitlab.com/fevermap/fevermap/-/issues" target="_blank">Gitlab</a>
        </p>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('development-mode-banner')) {
  customElements.define('development-mode-banner', DevelopmentModeBanner);
}
