import { LitElement, html, css } from 'lit-element';
import { MDCSlider } from '@material/slider';
import { MDCCheckbox } from '@material/checkbox/component';
import maleIcon from 'src/assets/images/male.svg';
import femaleIcon from 'src/assets/images/female.svg';
import { MDCRipple } from '@material/ripple/component';
import GeolocatorService from '../services/geolocator-service';
import 'src/app/components/input-field';
import 'src/app/components/select-field';
import SnackBar from '../components/snackbar';
import ScrollService from '../services/scroll-service';
import dayjs from 'dayjs';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util';
import DataEntryService from '../services/data-entry-service';
import Translator from '../util/translator';

class FevermapDataEntry extends LitElement {
    static get properties() {
        return {
            latestEntry: { type: Object },
            lastSubmissionTime: { type: String },
            lastSubmissionIsTooCloseToNow: { type: Boolean },
            previousSubmissions: { type: Array },
            hasQueuedEntries: { type: Boolean },
            queuedEntries: { type: Array },
            firstTimeSubmitting: { type: Boolean },

            hasFever: { type: Boolean },
            feverAmount: { type: Number },
            feverAmountNowKnown: { type: Boolean },
            gender: { type: String },

            geoCodingInfo: { type: Object },
            countrySelectionOptions: { type: Array },
            selectedCountryIndex: { type: Number },

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
        let lastLocation = localStorage.getItem('LAST_LOCATION');
        if (lastEntryTime && lastEntryTime !== 'undefined') {
            this.lastSubmissionTime = dayjs(Number(lastEntryTime)).format('DD-MM-YYYY : HH:mm');
            this.lastSubmissionIsTooCloseToNow = Date.now() - Number(lastEntryTime) < 43200000; // 12 hours in milliseconds
        }
        this.firstTimeSubmitting = latestEntry == null;
        this.errorMessage = null;
        this.hasFever = null;
        this.feverAmount = 37;
        this.feverAmountNotKnown = false;
        this.gender = latestEntry ? latestEntry.gender : null;
        this.location = latestEntry ? latestEntry.location : null;
        this.latestEntry = latestEntry ? latestEntry : null;
        this.geoCodingInfo = latestEntry ? JSON.parse(lastLocation) : null;

        // Actual usage of F versus C in measuring body temperature is unclear, this mapping largely assumes
        // weather and body temperature units correlate.
        this.fahrenheitTerritories = {
            CA: false, // Canada uses both, and F mostly for cooking
            US: true,
            'US-AS': true,
            'US-GU': true,
            'US-MP': true,
            'US-PR': true,
            'US-UM': true,
            'US-VI': true,
            BZ: true, // Belize
            PW: true, // Palau
            FM: true, // Micronesia
            BS: true, // Bahamas
            MH: true, // Marshall Islands
            KY: true, // Cayman
        };
        this.createCountrySelectOptions();
        this.previousSubmissions = [];
        this.hasQueuedEntries = false;
        this.queuedEntries = [];
    }

    firstUpdated(_changedProperties) {
        this.initializeComponents();
        this.getGeoLocationInfo();
        this.getPreviousSubmissionsFromIndexedDb();
        this.getQueuedEntriesFromIndexedDb();
    }

    createCountrySelectOptions() {
        this.countrySelectionOptions = GeolocatorService.getCountryList().map(entry => ({
            id: entry.country.country_id,
            name: `${entry.country.country_name.substring(0, 1)}${entry.country.country_name
                .substring(1)
                .toLowerCase()} (${entry.country.country_id})`,
        }));
        this.selectedCountryIndex = 0;
    }

    async getPreviousSubmissionsFromIndexedDb() {
        let db = await DBUtil.getInstance();
        const previousSubmissions = await db.getAll(FEVER_ENTRIES);
        if (previousSubmissions && previousSubmissions.length > 0) {
            this.previousSubmissions = previousSubmissions;
        }
    }

    async getQueuedEntriesFromIndexedDb() {
        let db = await DBUtil.getInstance();
        const queuedSubmissions = await db.getAll(QUEUED_ENTRIES);
        if (queuedSubmissions && queuedSubmissions.length > 0) {
            this.hasQueuedEntries = true;
            this.queuedEntries = queuedSubmissions;
        }
    }

    initializeComponents() {
        const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));
    }

    async getGeoLocationInfo(forceUpdate) {
        if (!this.geoCodingInfo || forceUpdate) {
            navigator.geolocation.getCurrentPosition(async success => {
                this.geoCodingInfo = await GeolocatorService.getGeoCodingInfo(
                    success.coords.latitude,
                    success.coords.longitude
                );

                delete this.geoCodingInfo.success;

                let countryInSelect = this.countrySelectionOptions.find(
                    opt => opt.id === this.geoCodingInfo.countryShort
                );
                if (countryInSelect) {
                    this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
                }

                this.performUpdate();
                if (forceUpdate) {
                    SnackBar.success(Translator.get('system_messages.success.location_update'));
                }
            });
        } else {
            let countryInSelect = this.countrySelectionOptions.find(opt => opt.id === this.geoCodingInfo.countryShort);
            if (countryInSelect) {
                this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
            }
        }
    }

    handleFeverButton(hasFever) {
        this.hasFever = hasFever;
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

    fahrenheitToCelsius(value) {
        return ((value - 32) / 1.8).toFixed(1);
    }

    celsiusToFahrenheit(value) {
        return (value * 1.8 + 32).toFixed(1);
    }

    useFahrenheit() {
        return this.geoCodingInfo && this.geoCodingInfo.countryShort
            ? !!this.fahrenheitTerritories[this.geoCodingInfo.countryShort]
            : false;
    }

    /**
     * @param reverse Use the other unit
     * @param value Value to stringify, leave undefined to use input value
     * @returns {string}
     */
    getFeverWithUnit(reverse, value) {
        let feverValue = arguments.length >= 2 ? value : this.feverAmount;
        return !!reverse ^ this.useFahrenheit() ? this.celsiusToFahrenheit(feverValue) + ' °F' : feverValue + ' °C';
    }

    initSlider() {
        const slider = new MDCSlider(this.querySelector('.mdc-slider'));
        slider.listen('MDCSlider:input', () => {
            this.feverAmount = slider.value.toFixed(1);
        });
        return slider;
    }

    async handleSubmit() {
        let feverData = {};
        let device_id = localStorage.getItem('DEVICE_ID');
        if (!device_id) {
            device_id = Date.now();
            localStorage.setItem('DEVICE_ID', device_id);
        }

        feverData.device_id = device_id;
        feverData.fever_status = this.hasFever;
        feverData.fever_temp = !this.feverAmountNotKnown && this.hasFever ? this.feverAmount : null;
        feverData.birth_year = this.querySelector('#birth-year').getValue();
        feverData.gender = this.gender;
        const geoCodingInfo = await this.getGeoCodingInputInfo();
        feverData.location_country_code = geoCodingInfo.country_code;
        feverData.location_postal_code = geoCodingInfo.postal_code;
        feverData.location_lng = geoCodingInfo.location_lng;
        feverData.location_lat = geoCodingInfo.location_lat;

        if (feverData.birth_year > 2020 || feverData.birth_year < 1900) {
            this.errorMessage = Translator.get('system_messages.error.age_not_in_range');
            return;
        }

        if (feverData.gender === null) {
            this.errorMessage = Translator.get('system_messages.error.gender_not_set');
            return;
        }

        if (
            feverData.fever_status === null ||
            (feverData.fever_status && (feverData.fever_temp < 37 || feverData.fever_temp > 44))
        ) {
            this.errorMessage = Translator.get('system_messages.error.fever_temp_value_invalid');
            return;
        }
        if (this.locationDataIsInvalid(geoCodingInfo)) {
            this.errorMessage = Translator.get('system_messages.error.location_data_invalid');
            return;
        }
        this.errorMessage = null;

        const submissionResponse = await DataEntryService.handleDataEntrySubmission(feverData);

        if (submissionResponse.success) {
            this.handlePostSubmissionActions(feverData, Date.now());
        } else {
            switch (submissionResponse.reason) {
                case 'INVALID_DATA':
                    SnackBar.error(Translator.get('system_messages.error.api_data_invalid'));
                    break;
                case 'NETWORK_STATUS_OFFLINE':
                    this.handlePostSubmissionActions(feverData, Date.now(), true);
                    break;
                default:
                    SnackBar.error(Translator.get('system_messages.error.api_data_invalid'));
            }
        }
    }

    async handlePostSubmissionActions(feverData, submissionTime, entryGotQueued) {
        localStorage.setItem('LATEST_ENTRY', JSON.stringify(feverData));
        localStorage.setItem('LAST_ENTRY_SUBMISSION_TIME', submissionTime);

        this.lastSubmissionTime = dayjs(Number(submissionTime)).format('DD-MM-YYYY : HH:mm');
        this.lastSubmissionIsTooCloseToNow = true;

        if (!entryGotQueued) {
            const db = await DBUtil.getInstance();
            const insertSuccess = await db.add(FEVER_ENTRIES, feverData);
            SnackBar.success(Translator.get('system_messages.success.data_entry'));
        } else {
            SnackBar.success(Translator.get('system_messages.success.offline_entry_queued'));
        }
        ScrollService.scrollToTop();
    }

    async submitQueuedEntries() {
        let db = await DBUtil.getInstance();
        let successfulSyncCount = 0;
        await this.queuedEntries.map(async (entry, i) => {
            const id = entry.id;
            delete entry.id;
            const submissionResponse = await DataEntryService.handleDataEntrySubmission(entry, false);
            if (submissionResponse.success) {
                db.delete(QUEUED_ENTRIES, id);
                await db.add(FEVER_ENTRIES, entry);
                successfulSyncCount++;
            }
            if (i === this.queuedEntries.length - 1) {
                if (successfulSyncCount > 0) {
                    SnackBar.success(Translator.get('system_messages.success.sync_finished'));
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            }
        });
    }

    locationDataIsInvalid(locationData) {
        return !locationData || !locationData.country_code || !locationData.location_lat || !locationData.location_lng;
    }

    async getGeoCodingInputInfo() {
        const postal_code = this.querySelector('#location-postal-code').getValue();
        const country = this.querySelector('#location-country').getValue();

        const coords = this.geoCodingInfo.coords;

        const geoCodingInfo = await GeolocatorService.getGeoCodingInfoByPostalCodeAndCountry(
            postal_code,
            country.value.id
        );
        localStorage.setItem('LAST_LOCATION', JSON.stringify(geoCodingInfo));

        return {
            country_code: geoCodingInfo.countryShort,
            location_lat: coords.lat,
            location_lng: coords.lng,
            postal_code: geoCodingInfo.postal_code,
        };
    }

    async handleLocationUpdate() {
        const postal_code = this.querySelector('#location-postal-code').getValue();
        const country = this.querySelector('#location-country').getValue();

        if (!postal_code || !country) {
            return;
        }
        const geoCodingInfo = await GeolocatorService.getGeoCodingInfoByPostalCodeAndCountry(
            postal_code,
            country.value.id
        );
        if (!geoCodingInfo.success) {
            console.error(geoCodingInfo);
            SnackBar.error(Translator.get('system_messages.error.location_data_invalid'));
            this.errorMessage = Translator.get('system_messages.error.location_data_invalid');
            return;
        }
        this.errorMessage = null;
        delete geoCodingInfo.success;
        this.geoCodingInfo = geoCodingInfo;
        SnackBar.success(Translator.get('system_messages.success.location_update'));
    }

    render() {
        return html`
            <div class="container view-wrapper">
                <div class="fevermap-data-entry-content">
                    <h1>${Translator.get('entry.data_entry')}</h1>
                    ${this.firstTimeSubmitting
                        ? html`
                              <p class="first-entry-disclaimer">${Translator.get('entry.first_entry_disclaimer')}</p>
                          `
                        : ''}
                    ${this.lastSubmissionTime
                        ? html`
                              <div class="entry-disclaimer">
                                  <p>${Translator.get('entry.last_submission')}: ${this.lastSubmissionTime}</p>
                                  ${this.lastSubmissionIsTooCloseToNow
                                      ? html`
                                            <p>
                                                ${Translator.get('entry.submission_period_disclaimer')}
                                            </p>
                                        `
                                      : ''}
                              </div>
                          `
                        : ''}
                    ${this.getQueuedEntriesField()}
                    <div class="entry-fields${this.lastSubmissionIsTooCloseToNow ? ' entry-fields--disabled' : ''}">
                        ${this.getFeverMeter()} ${this.getYearOfBirthInput()} ${this.getGenderInput()}
                        ${this.getGeoLocationInput()} ${this.getSubmitButton()}
                    </div>
                    ${this.getPreviousSubmissionsSummary()}
                </div>
            </div>
        `;
    }

    getQueuedEntriesField() {
        return html`
            ${this.hasQueuedEntries
                ? html`
                      <div class="queued-entries-field">
                          <p>
                              ${Translator.get('entry.queued_entries', { queuedEntries: this.queuedEntries.length })}
                          </p>
                          <div class="submit-queued-button">
                              <button class="mdc-button mdc-button--outlined" @click="${this.submitQueuedEntries}">
                                  <div class="mdc-button__ripple"></div>

                                  <i class="material-icons mdc-button__icon" aria-hidden="true">sync</i>
                                  <span class="mdc-button__label">${Translator.get('entry.sync_now')}</span>
                              </button>
                          </div>
                      </div>
                  `
                : ''}
        `;
    }

    getFeverMeter() {
        return html`
            <div class="entry-field">
                <p>${Translator.get('entry.questions.do_you_have_fever')}</p>
                <div
                    class="fever-answer-button mdc-elevation--z3${
                        this.hasFever ? ' fever-answer-button--has-fever' : ' fever-answer-button--no-fever'
                    }
                    ${this.hasFever === null ? ' fever-answer-button--not-set' : ''}"
                >
                    <div class="no-button fever-button${this.hasFever === false ? ' fever-button--selected' : ''}"
                    @click="${() => this.handleFeverButton(false)}">
                        <p>${Translator.get('entry.questions.no')}</p>
                    </div>
                    <div class="yes-button fever-button${this.hasFever ? ' fever-button--selected' : ''}"
                    @click="${() => this.handleFeverButton(true)}">
                        <p>${Translator.get('entry.questions.yes')}</p>
                    </div>
                </div>
                    ${
                        this.hasFever
                            ? html`
                                  <div class="fever-meters ${this.feverAmountNotKnown ? ' fever-meters--hidden' : ''}">
                                      <p>${Translator.get('entry.questions.how_much')}</p>

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
                                      <p class="fever-amount-display">
                                          ${Translator.get('entry.questions.degrees_of_fever', {
                                              degrees: this.getFeverWithUnit(),
                                          })}
                                          (${this.getFeverWithUnit(true)})
                                      </p>
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

                                      <label for="checkbox-1">${Translator.get('entry.questions.not_measured')}</label>
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
                <p>${Translator.get('entry.questions.birth_year')}</p>
                <input-field
                    placeHolder=${Translator.get('entry.questions.birth_year_placeholder')}
                    fieldId="year-of-birth-input"
                    id="birth-year"
                    value="${this.latestEntry ? this.latestEntry.birth_year : ''}"
                    type="number"
                ></input-field>
            </div>
        `;
    }

    getGenderInput() {
        return html`
            <div class="entry-field">
                <p>${Translator.get('entry.questions.gender_in_passport')}</p>
                <div
                    class="gender-input-holder mdc-elevation--z3${this.gender == null
                        ? ' gender-input-holder--none-selected'
                        : ''}"
                >
                    <div
                        @click="${() => (this.gender = 'M')}"
                        class="gender-input gender-input--male${this.gender === 'M' ? ' gender-input--selected' : ''}"
                    >
                        <img src="${maleIcon}" />
                        <p>${Translator.get('entry.questions.male')}</p>
                    </div>
                    <div
                        @click="${() => (this.gender = 'F')}"
                        class="gender-input gender-input--female${this.gender === 'F' ? ' gender-input--selected' : ''}"
                    >
                        <img src="${femaleIcon}" />
                        <p>${Translator.get('entry.questions.female')}</p>
                    </div>
                </div>
            </div>
        `;
    }

    getGeoLocationInput() {
        return html`
            <div class="entry-field">
                <p>${Translator.get('entry.questions.location_information')}</p>
                <input-field
                    placeHolder="${Translator.get('entry.questions.city')}"
                    fieldId="location-city-input"
                    id="location-city"
                    value="${this.geoCodingInfo ? this.geoCodingInfo.city : ''}"
                    ?disabled=${true}
                ></input-field>
                <select-field
                    id="location-country"
                    label="${Translator.get('entry.questions.country')}"
                    .options="${this.countrySelectionOptions}"
                    selectedValueIndex="${this.selectedCountryIndex}"
                ></select-field>
                <input-field
                    placeHolder="${Translator.get('entry.questions.postal_code')}"
                    fieldId="location-postal-code"
                    id="location-postal-code"
                    value="${this.geoCodingInfo && this.geoCodingInfo.postal_code
                        ? this.geoCodingInfo.postal_code
                        : ''}"
                ></input-field>
                <p class="subtitle">
                    ${Translator.get('entry.questions.location_determination_subtitle')}
                </p>
                <p class="subtitle">
                    ${Translator.get('entry.questions.location_change_subtitle')}
                </p>
                <div class="geolocation-button">
                    <button class="mdc-button mdc-button--outlined" @click="${() => this.handleLocationUpdate()}">
                        <div class="mdc-button__ripple"></div>

                        <i class="material-icons mdc-button__icon" aria-hidden="true">maps</i>
                        <span class="mdc-button__label">${Translator.get('entry.questions.update_location')}</span>
                    </button>
                </div>
                <div class="geolocation-button">
                    <button class="mdc-button mdc-button--outlined" @click="${() => this.getGeoLocationInfo(true)}">
                        <div class="mdc-button__ripple"></div>

                        <i class="material-icons mdc-button__icon" aria-hidden="true">maps</i>
                        <span class="mdc-button__label">${Translator.get('entry.questions.use_gps')}</span>
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
                        <span class="mdc-button__label">${Translator.get('entry.submit')}</span>
                    </button>
                </div>
            </div>
        `;
    }

    getPreviousSubmissionsSummary() {
        return html`
            <div class="submission-summary">
                <p>${Translator.get('entry.previous_submissions')}</p>
                ${this.previousSubmissions.map(submission => {
                    return html`
                        <div
                            class="submission${submission.fever_status
                                ? ' submission--has-fever'
                                : ' submission--no-fever'}"
                        >
                            <p>
                                ${dayjs(submission.submission_time).format('DD-MM-YYYY:HH:mm')} - Fever:
                                ${submission.fever_status
                                    ? Translator.get('entry.questions.yes')
                                    : Translator.get('entry.questions.no')}${submission.fever_status
                                    ? `, ${this.getFeverWithUnit(false, submission.fever_temp)}`
                                    : ''}
                            </p>
                        </div>
                    `;
                })}
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
