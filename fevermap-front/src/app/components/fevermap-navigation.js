import { LitElement, html } from 'lit-element';

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

    firstUpdated(_changedProperties) {
        this.rootElem = document.querySelector('fevermap-root');
        if (!this.currentViewObject) {
            this.currentViewObject = document.querySelector(this.currentView);
        }
    }

    handleNavigationClick(e) {
        let navigationDiv = e.target;
        while (navigationDiv.nodeName !== 'DIV') {
            navigationDiv = navigationDiv.parentNode;
        }
        let targetView = navigationDiv.dataset.navigationView;
        if (targetView === this.currentView) {
            return;
        }
        let navigationOrder = navigationDiv.dataset.navigationOrder;
        this.transitionToNewView(targetView, navigationOrder);
        this.currentView = targetView;
    }

    transitionToNewView(targetView, navigationOrder) {
        let oldViewObject = this.currentViewObject;
        let oldViewWrapper = oldViewObject.querySelector('.view-wrapper');
        let oldViewNavigationOrder = this.currentViewNavigationOrder;

        this.currentViewNavigationOrder = navigationOrder;

        let newView = document.createElement(targetView);
        this.currentViewObject = newView;
        let newTransitionClass =
            oldViewNavigationOrder > this.currentViewNavigationOrder
                ? 'view-wrapper--transitioning-from-left'
                : 'view-wrapper--transitioning-from-right';
        let oldTransitionClass =
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
            let newViewWrapper = newView.querySelector('.view-wrapper');
            newViewWrapper.classList.add(transitionClass);
            newView.style.display = 'block';
            this.addSlideInClassRemoveListener(newViewWrapper, transitionClass);
        }, 0);
    }

    render() {
        return html`
            <div class="fevermap-navigation-wrapper mdc-elevation--z5">
                <div
                    @click="${this.handleNavigationClick}"
                    class="fevermap-navigation-block${this.currentView === 'fevermap-landing'
                        ? ' fevermap-navigation-block--selected'
                        : ''}"
                    id="about"
                    data-navigation-view="fevermap-landing"
                    data-navigation-order="1"
                >
                    <material-icon icon="info"></material-icon>
                    <p>About</p>
                </div>
                <div
                    @click="${this.handleNavigationClick}"
                    class="fevermap-navigation-block${this.currentView === 'fevermap-data-entry'
                        ? ' fevermap-navigation-block--selected'
                        : ''}"
                    id="data-entry"
                    data-navigation-view="fevermap-data-entry"
                    data-navigation-order="2"
                >
                    <material-icon icon="add_comment"></material-icon>
                    <p>Data Entry</p>
                </div>
                <div
                    @click="${this.handleNavigationClick}"
                    class="fevermap-navigation-block${this.currentView === 'fevermap-stats'
                        ? ' fevermap-navigation-block--selected'
                        : ''}"
                    id="stats"
                    data-navigation-view="fevermap-stats"
                    data-navigation-order="3"
                >
                    <material-icon icon="assessment"></material-icon>
                    <p>Statistics</p>
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
