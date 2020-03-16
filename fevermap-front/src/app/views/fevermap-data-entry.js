import { LitElement, html, css } from 'lit-element';
import Translator from '../util/translator';
import { MDCSlider } from '@material/slider';
import { MDCCheckbox } from '@material/checkbox/component';
import { MDCTextField } from '@material/textfield/component';
import maleIcon from 'src/assets/images/male.svg';
import femaleIcon from 'src/assets/images/female.svg';

class FevermapDataEntry extends LitElement {
    static get properties() {
        return {
            hasFever: { type: Boolean },
            feverAmount: { type: Number },
            feverAmountNowKnown: { type: Boolean },
            gender: { type: String },
        };
    }

    static get styles() {
        return [];
    }

    constructor() {
        super();
        this.hasFever = false;
        this.feverAmount = 37;
        this.feverAmountNotKnown = false;
        this.gender = 'male';
    }

    firstUpdated(_changedProperties) {
        this.initializeComponents();
    }

    initializeComponents() {
        const textField = new MDCTextField(this.querySelector('.mdc-text-field'));
    }

    handleFeverButton() {
        this.hasFever = !this.hasFever;
        if (this.hasFever) {
            setTimeout(() => {
                const slider = new MDCSlider(this.querySelector('.mdc-slider'));
                slider.listen('MDCSlider:change', () => {
                    this.feverAmount = slider.value;
                });

                let checkboxElem = this.querySelector('.mdc-checkbox');
                const checkbox = new MDCCheckbox(checkboxElem);
                checkboxElem.addEventListener('change', () => {
                    this.feverAmountNotKnown = checkbox.checked;
                    this.feverAmount = checkbox.checked ? 0 : slider.value;
                    slider.getDefaultFoundation().setDisabled(checkbox.checked);
                });
            });
        }
    }

    initializeSlider() {}

    render() {
        return html`
            <div class="container view-wrapper">
                <div class="fevermap-data-entry-content">
                    <h1>Data Entry</h1>

                    <div class="entry-fields">
                        ${this.getFeverMeter()} ${this.getYearOfBirthInput()} ${this.getGenderInput()}
                    </div>
                </div>
            </div>
        `;
    }

    getFeverMeter() {
        return html`
            <div class="entry-field">
                <p>Do you have fever at the moment?</p>
                <div
                    class="fever-answer-button mdc-elevation--z3${this.hasFever
                        ? ' fever-answer-button--has-fever'
                        : ' fever-answer-button--no-fever'}"
                    @click="${this.handleFeverButton}"
                >
                    <div class="no-button fever-button${this.hasFever ? '' : ' fever-button--selected'}">
                        <p>No</p>
                    </div>
                    <div class="yes-button fever-button${this.hasFever ? ' fever-button--selected' : ''}">
                        <p>Yes</p>
                    </div>
                </div>
                ${this.hasFever
                    ? html`
                          <p>How much</p>
                          <div class="fever-slider">
                              <div
                                  class="mdc-slider mdc-slider--discrete"
                                  tabindex="0"
                                  role="slider"
                                  aria-valuemin="37"
                                  aria-valuemax="44"
                                  aria-valuenow="37"
                                  aria-label="Select Value"
                              >
                                  <div class="mdc-slider__track-container">
                                      <div class="mdc-slider__track"></div>
                                  </div>
                                  <div class="mdc-slider__thumb-container">
                                      <div class="mdc-slider__pin">
                                          <span class="mdc-slider__pin-value-marker"></span>
                                      </div>
                                      <svg class="mdc-slider__thumb" width="21" height="21">
                                          <circle cx="10.5" cy="10.5" r="7.875"></circle>
                                      </svg>
                                      <div class="mdc-slider__focus-ring"></div>
                                  </div>
                              </div>
                          </div>
                          ${this.feverAmountNotKnown
                              ? ''
                              : html`
                                    <p class="fever-amount-display">${this.feverAmount} degrees of fever</p>
                                `}
                          <div class="mdc-form-field">
                              <div class="mdc-checkbox">
                                  <input type="checkbox" class="mdc-checkbox__native-control" id="checkbox-1" />
                                  <div class="mdc-checkbox__background">
                                      <svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
                                          <path
                                              class="mdc-checkbox__checkmark-path"
                                              fill="none"
                                              d="M1.73,12.91 8.1,19.28 22.79,4.59"
                                          />
                                      </svg>
                                      <div class="mdc-checkbox__mixedmark"></div>
                                  </div>
                                  <div class="mdc-checkbox__ripple"></div>
                              </div>

                              <label for="checkbox-1">Don't know exactly, not measured</label>
                          </div>
                      `
                    : ''}
            </div>
        `;
    }

    getYearOfBirthInput() {
        return html`
            <div class="entry-field">
                <p>Birth year</p>
                <label class="mdc-text-field">
                    <div class="mdc-text-field__ripple"></div>
                    <input class="mdc-text-field__input" type="text" aria-labelledby="year-of-birth" />
                    <span class="mdc-floating-label" id="year-of-birth">Year of birth (years 1900-2020)</span>
                    <div class="mdc-line-ripple"></div>
                </label>
            </div>
        `;
    }

    getGenderInput() {
        return html`
            <div class="entry-field">
                <p>Gender as stated in your passport or other government records</p>
                <div class="gender-input-holder mdc-elevation--z3">
                    <div
                        @click="${() => (this.gender = 'male')}"
                        class="gender-input gender-input--male${this.gender === 'male'
                            ? ' gender-input--selected'
                            : ''}"
                    >
                        <img src="${maleIcon}" />
                        <p>Male</p>
                    </div>
                    <div
                        @click="${() => (this.gender = 'female')}"
                        class="gender-input gender-input--female${this.gender === 'female'
                            ? ' gender-input--selected'
                            : ''}"
                    >
                        <img src="${femaleIcon}" />
                        <p>Female</p>
                    </div>
                </div>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }
}

if (!customElements.get('fevermap-data-entry')) {
    customElements.define('fevermap-data-entry', FevermapDataEntry);
}
