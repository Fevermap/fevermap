/* eslint-disable class-methods-use-this,no-param-reassign */
import { LitElement, html } from 'lit-element';
import Translator from '../util/translator.js';

class FevermapNavigation extends LitElement {
  static get properties() {
    return {
      currentView: { type: String },
      currentViewObject: { type: Object },
      currentViewNavigationOrder: { type: Number },
      rootElem: { type: Object },
    };
  }

  constructor() {
    super();
    this.currentView = '';
    this.currentViewObject = null;
    this.currentViewNavigationOrder = 1;
    this.rootElem = null;
  }

  firstUpdated() {
    this.rootElem = document.querySelector('fevermap-root');
    if (!this.currentViewObject) {
      this.currentViewObject = document.querySelector(this.currentView);
      this.currentViewNavigationOrder = this.querySelector(
        `[data-navigation-view='${this.currentView}']`,
      ).dataset.navigationOrder;
    }
  }

  handleNavigationClick(e) {
    let navigationDiv = e.target;
    while (navigationDiv.nodeName !== 'DIV') {
      navigationDiv = navigationDiv.parentNode;
    }
    const targetView = navigationDiv.dataset.navigationView;
    if (targetView === this.currentView) {
      return;
    }
    const { navigationOrder } = navigationDiv.dataset;
    this.transitionToNewView(targetView, navigationOrder);
    this.currentView = targetView;
  }

  transitionToNewView(targetView, navigationOrder) {
    const oldViewObject = this.currentViewObject;
    const oldViewWrapper = oldViewObject.querySelector('.view-wrapper');
    const oldViewNavigationOrder = this.currentViewNavigationOrder;

    this.currentViewNavigationOrder = navigationOrder;

    const newView = document.createElement(targetView);
    this.currentViewObject = newView;
    const newTransitionClass =
      oldViewNavigationOrder > this.currentViewNavigationOrder
        ? 'view-wrapper--transitioning-from-left'
        : 'view-wrapper--transitioning-from-right';
    const oldTransitionClass =
      oldViewNavigationOrder < this.currentViewNavigationOrder
        ? 'view-wrapper--transitioning-to-left'
        : 'view-wrapper--transitioning-to-right';
    this.handleSlideIn(newView, newTransitionClass);

    this.addObjectRemoveListener(oldViewWrapper, oldViewObject);
    oldViewWrapper.classList.add(oldTransitionClass);
  }

  addObjectRemoveListener(viewWrapper, viewObject) {
    viewWrapper.addEventListener('animationend', () => {
      viewObject.remove();
    });
  }

  addSlideInClassRemoveListener(viewWrapper, transitionClass) {
    viewWrapper.addEventListener('animationend', () => {
      viewWrapper.classList.remove(transitionClass);
    });
  }

  handleSlideIn(newView, transitionClass) {
    this.rootElem.prepend(newView);
    newView.style.display = 'none';
    // Give it time to hit the DOM
    setTimeout(() => {
      const newViewWrapper = newView.querySelector('.view-wrapper');
      newViewWrapper.classList.add(transitionClass);
      newView.style.display = 'block';
      this.addSlideInClassRemoveListener(newViewWrapper, transitionClass);
    }, 100);
  }

  render() {
    return html`
      <div class="fevermap-navigation-wrapper mdc-elevation--z5">
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="fevermap-navigation-block${this.currentView === 'fevermap-landing'
            ? ' fevermap-navigation-block--selected'
            : ''}"
          id="about"
          data-navigation-view="fevermap-landing"
          data-navigation-order="1"
        >
          <material-icon icon="info"></material-icon>
          <p>${Translator.get('landing.about')}</p>
        </div>
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="fevermap-navigation-block${this.currentView === 'fevermap-data-view'
            ? ' fevermap-navigation-block--selected'
            : ''}"
          id="data-entry"
          data-navigation-view="fevermap-data-view"
          data-navigation-order="2"
        >
          <material-icon icon="person"></material-icon>
          <p>${Translator.get('entry.data_entry')}</p>
        </div>
        <div
          tabindex="0"
          @click="${this.handleNavigationClick}"
          class="fevermap-navigation-block${this.currentView === 'fevermap-stats'
            ? ' fevermap-navigation-block--selected'
            : ''}"
          id="stats"
          data-navigation-view="fevermap-stats"
          data-navigation-order="3"
        >
          <material-icon icon="assessment"></material-icon>
          <p>${Translator.get('stats.stats')}</p>
        </div>
      </div>
      ,
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-navigation')) {
  customElements.define('fevermap-navigation', FevermapNavigation);
}
