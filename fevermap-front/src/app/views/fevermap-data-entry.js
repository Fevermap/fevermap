import { LitElement, html, css } from 'lit-element';
import { MDCSlider } from '@material/slider';
import { MDCCheckbox } from '@material/checkbox/component';
import maleIcon from 'src/assets/images/male.svg';
import femaleIcon from 'src/assets/images/female.svg';
import { MDCRipple } from '@material/ripple/component';
import GeolocatorService from '../services/geolocator-service';
import 'src/app/components/input-field';
import SnackBar from '../components/snackbar';
import ScrollService from '../services/scroll-service';
import dayjs from 'dayjs';

class FevermapDataEntry extends LitElement {
    static get properties() {
        return {
            latestEntry: { type: Object },
            lastSubmissionTime: { type: String },
            lastSubmissionIsTooCloseToNow: { type: Boolean },

            hasFever: { type: Boolean },
            feverAmount: { type: Number },
            feverAmountNowKnown: { type: Boolean },
            gender: { type: String },
            geoCodingInfo: { type: Object },

            errorMessage: { type: String },
        };
    }

    static get styles() {
        return [];
    }

    constructor() {
        super();
        let latestEntry = JSON.parse(localStorage.getItem('LATEST_ENTRY'));
        let lastEntryTime = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
        if (lastEntryTime) {
            this.lastSubmissionTime = dayjs(Number(lastEntryTime)).format('DD-MM-YYYY : HH:mm');
            this.lastSubmissionIsTooCloseToNow = Date.now() - Number(lastEntryTime) < 43200000; // 12 hours in milliseconds
        }
        this.errorMessage = null;
        this.hasFever = false;
        this.feverAmount = 37;
        this.feverAmountNotKnown = false;
        this.gender = latestEntry ? latestEntry.gender : 'male';
        this.location = latestEntry ? latestEntry.location : null;
        this.latestEntry = latestEntry ? latestEntry : null;
        this.geoCodingInfo = latestEntry ? latestEntry.geoCodingInfo : null;
    }

    firstUpdated(_changedProperties) {
        this.initializeComponents();
        this.getGeoLocationInfo();
    }

    initializeComponents() {
        const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));
    }

    async getGeoLocationInfo(forceUpdate) {
        if (!this.geoCodingInfo || this.locationDataIsInvalid(this.geoCodingInfo) || forceUpdate) {
            navigator.geolocation.getCurrentPosition(async success => {
                this.geoCodingInfo = await GeolocatorService.getGeoCodingInfo(
                    success.coords.latitude,
                    success.coords.longitude
                );

                delete this.geoCodingInfo.success;
                this.performUpdate();
                if (forceUpdate) {
                    SnackBar.success('Location updated successfully.');
                }
            });
        }
    }

    handleFeverButton() {
        this.hasFever = !this.hasFever;
        if (this.hasFever) {
            setTimeout(() => {
                let slider = this.initSlider();

                let checkboxElem = this.querySelector('.mdc-checkbox');
                const checkbox = new MDCCheckbox(checkboxElem);
                checkboxElem.addEventListener('change', () => {
                    this.feverAmountNotKnown = checkbox.checked;
                    this.feverAmount = checkbox.checked ? 0 : slider.value.toFixed(1);
                    slider.getDefaultFoundation().setDisabled(checkbox.checked);
                });
            });
        }
    }

    initSlider() {
        const slider = new MDCSlider(this.querySelector('.mdc-slider'));
        slider.listen('MDCSlider:input', () => {
            this.feverAmount = slider.value.toFixed(1);
        });
        return slider;
    }

    handleSubmit() {
        let feverData = {};
        feverData.hasFever = this.hasFever;
        feverData.feverAmount = !this.feverAmountNotKnown && this.hasFever ? this.feverAmount : null;
        feverData.birthYear = this.querySelector('#birth-year').value;
        feverData.gender = this.gender;
        feverData.location = '';
        feverData.geoCodingInfo = this.getGeoCodingInputInfo();

        if (this.locationDataIsInvalid(feverData.geoCodingInfo)) {
            this.errorMessage = 'Location data is invalid';
            return;
        }
        this.errorMessage = null;

        console.table(feverData);
        localStorage.setItem('LATEST_ENTRY', JSON.stringify(feverData));
        localStorage.setItem('LAST_ENTRY_SUBMISSION_TIME', Date.now());
        this.lastSubmissionTime = dayjs(Number(Date.now())).format('DD-MM-YYYY : HH:mm');
        this.lastSubmissionIsTooCloseToNow = true;
        SnackBar.success('Successfully submitted data entry');
        ScrollService.scrollToTop();
    }

    locationDataIsInvalid(locationData) {
        return (
            !locationData ||
            !locationData.country ||
            !locationData.city ||
            !locationData.postal_code ||
            Object.values(locationData).includes('undefined')
        );
    }

    getGeoCodingInputInfo() {
        let city = this.querySelector('#location-city').getValue();
        let postal_code = this.querySelector('#location-postal-code').getValue();
        let country = this.querySelector('#location-country').getValue();
        let coords = this.geoCodingInfo.coords;
        return { city, postal_code, country, coords };
    }

    async handlePostalCodeChange(newPostalCode) {
        if (newPostalCode === this.geoCodingInfo.postal_code) {
            return;
        }
        let geoCodingInfo = await GeolocatorService.getGeoCodingInfoByPostalCodeAndCountry(
            newPostalCode,
            this.geoCodingInfo.country
        );
        if (!geoCodingInfo.success) {
            console.error(geoCodingInfo);
            SnackBar.error('Could not get location data.');
            this.errorMessage = 'Could not get location. Check the location information.';
            return;
        }
        this.errorMessage = null;
        delete geoCodingInfo.success;
        this.geoCodingInfo = geoCodingInfo;
        SnackBar.success('Location updated successfully.');
    }

    render() {
        return html`
            <div class="container view-wrapper">
                <div class="fevermap-data-entry-content">
                    <h1>Data Entry</h1>
                    ${this.lastSubmissionTime
                        ? html`
                              <div class="entry-disclaimer">
                                  <p>Last submission: ${this.lastSubmissionTime}</p>
                                  ${this.lastSubmissionIsTooCloseToNow
                                      ? html`
                                            <p>
                                                To prevent unnecessary data, submissions are restricted to once every 12
                                                hours.
                                            </p>
                                        `
                                      : ''}
                              </div>
                          `
                        : ''}
                    <div class="entry-fields${this.lastSubmissionIsTooCloseToNow ? ' entry-fields--disabled' : ''}">
                        ${this.getFeverMeter()} ${this.getYearOfBirthInput()} ${this.getGenderInput()}
                        ${this.getGeoLocationInput()} ${this.getSubmitButton()}
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
                    class="fever-answer-button mdc-elevation--z3${
                        this.hasFever ? ' fever-answer-button--has-fever' : ' fever-answer-button--no-fever'
                    }"
                    @click="${this.handleFeverButton}"
                >
                    <div class="no-button fever-button${this.hasFever ? '' : ' fever-button--selected'}">
                        <p>No</p>
                    </div>
                    <div class="yes-button fever-button${this.hasFever ? ' fever-button--selected' : ''}">
                        <p>Yes</p>
                    </div>
                </div>
                    ${
                        this.hasFever
                            ? html`
                                  <div class="fever-meters ${this.feverAmountNotKnown ? ' fever-meters--hidden' : ''}">
                                      <p>How much</p>

                                      <div class="fever-slider">
                                          <div
                                              class="mdc-slider"
                                              tabindex="0"
                                              role="slider"
                                              aria-valuemin="37"
                                              aria-valuemax="44"
                                              aria-valuenow="37"
                                              aria-label="Select Value"
                                              data-step="0.1"
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
                                      <p class="fever-amount-display">${this.feverAmount} °C of fever</p>
                                  </div>
                                  <div
                                      class="mdc-form-field fever-not-measured-field ${this.feverAmountNotKnown
                                          ? ' fever-not-measured-field--checked'
                                          : ''}"
                                  >
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
                            : ''
                    }
                </div>
            </div>
        `;
    }

    getYearOfBirthInput() {
        return html`
            <div class="entry-field">
                <p>Birth year</p>
                <input-field
                    placeHolder="Year of birth (years 1900 - 2020)"
                    fieldId="year-of-birth-input"
                    id="birth-year"
                    value="${this.latestEntry ? this.latestEntry.birthYear : ''}"
                ></input-field>
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

    getGeoLocationInput() {
        return html`
            <div class="entry-field">
                <p>Location information</p>
                <input-field
                    placeHolder="City"
                    fieldId="location-city-input"
                    id="location-city"
                    value="${this.geoCodingInfo ? this.geoCodingInfo.city : ''}"
                    ?disabled=${true}
                ></input-field>
                <input-field
                    placeHolder="Country"
                    fieldId="location-country-input"
                    id="location-country"
                    value="${this.geoCodingInfo ? this.geoCodingInfo.country : ''}"
                    ?disabled="${true}"
                ></input-field>
                <input-field
                    placeHolder="Postal code"
                    fieldId="location-postal-code"
                    id="location-postal-code"
                    value="${this.geoCodingInfo ? this.geoCodingInfo.postal_code : ''}"
                    @input-blur="${e => this.handlePostalCodeChange(e.target.getValue())}"
                ></input-field>
                <p class="subtitle">
                    Location is determined using location API.
                </p>
                <p class="subtitle">
                    To update location information, update the value in the postal code field or press the button below.
                </p>
                <div class="geolocation-button">
                    <button class="mdc-button mdc-button--outlined">
                        <div class="mdc-button__ripple"></div>

                        <i class="material-icons mdc-button__icon" aria-hidden="true">maps</i>
                        <span class="mdc-button__label">Update location</span>
                    </button>
                </div>
                <div class="geolocation-button">
                    <button class="mdc-button mdc-button--outlined" @click="${() => this.getGeoLocationInfo(true)}">
                        <div class="mdc-button__ripple"></div>

                        <i class="material-icons mdc-button__icon" aria-hidden="true">maps</i>
                        <span class="mdc-button__label">Get location from GPS</span>
                    </button>
                </div>
            </div>
        `;
    }

    getSubmitButton() {
        return html`
            <div class="entry-field">
                ${this.errorMessage
                    ? html`
                          <p class="mdc-theme--error">${this.errorMessage}</p>
                      `
                    : ''}
                <div class="submit-button">
                    <button class="mdc-button mdc-button--outlined" @click="${this.handleSubmit}">
                        <div class="mdc-button__ripple"></div>

                        <i class="material-icons mdc-button__icon" aria-hidden="true">send</i>
                        <span class="mdc-button__label">Submit</span>
                    </button>
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
