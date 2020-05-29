/* eslint-disable class-methods-use-this,lit/no-value-attribute */
import { LitElement, html } from 'lit-element';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MDCCheckbox } from '@material/checkbox/component';
import tabtrap from 'tabtrap';
import GeolocatorService from '../services/geolocator-service.js';
import '../components/input-field.js';
import '../components/select-field.js';
import SnackBar from '../components/snackbar.js';
import ScrollService from '../services/scroll-service.js';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util.js';
import DataEntryService from '../services/data-entry-service.js';
import Translator from '../util/translator.js';
import FeverDataUtil from '../util/fever-data-util.js';
import '../components/gender-input.js';
import GoogleAnalyticsService from '../services/google-analytics-service.js';
import PWAService from '../services/pwa-service.js';
import NotificationService from '../services/notification-service.js';
import { syncClientInformation } from '../services/service-worker-service.js';
import BirthYearRangeSelector from '../components/birth-year-range-selector.js';

class FevermapDataEntry extends LitElement {
  static get properties() {
    return {
      latestEntry: { type: Object },
      queuedEntries: { type: Array },
      firstTimeSubmitting: { type: Boolean },

      hasFever: { type: Boolean },
      feverAmount: { type: Number },
      feverAmountNowKnown: { type: Boolean },
      gender: { type: String },
      birthYear: { type: String },

      geoCodingInfo: { type: Object },
      countrySelectionOptions: { type: Array },
      selectedCountryIndex: { type: Number },

      errorMessage: { type: String },

      carouselWrapper: { type: Object },
      currentQuestion: { type: Number },
      questionCount: { type: Number },

      symptoms: { type: Array },
      covidDiagnosed: { type: Boolean },

      transitioning: { type: Boolean },
    };
  }

  constructor() {
    super();
    const latestEntry = JSON.parse(localStorage.getItem('LATEST_ENTRY'));
    const lastLocation = localStorage.getItem('LAST_LOCATION');
    const gender = localStorage.getItem('GENDER');
    const birthYear = localStorage.getItem('BIRTH_YEAR');
    const covidDiagnosed = localStorage.getItem('COVID_DIAGNOSIS');

    this.errorMessage = null;
    this.hasFever = null;
    this.feverAmount = 35;
    this.feverAmountInMainUnit = 35;
    this.feverAmountInSecondaryUnit = 95;
    this.feverAmountNotKnown = false;
    this.birthYear = birthYear || null;
    this.gender = gender || null;
    this.location = latestEntry ? latestEntry.location : null;
    this.latestEntry = latestEntry || null;
    this.geoCodingInfo = latestEntry ? JSON.parse(lastLocation) : null;
    this.covidDiagnosed = covidDiagnosed === 'true';

    this.firstTimeSubmitting = this.gender == null || this.birthYear == null;

    this.createCountrySelectOptions();
    this.queuedEntries = [];

    this.currentQuestion = 1;
    this.questionCount = 4;
    this.symptoms = [];
    this.transitioning = false;
  }

  firstUpdated() {
    this.initSlider();

    // The logic for handling main and secondary temperature unit is dependant on having the country code
    this.getGeoLocationInfo().then(() => {
      this.feverAmountInMainUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
        false,
        this.feverAmount,
        this.geoCodingInfo,
      );
      this.feverAmountInSecondaryUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
        true,
        this.feverAmount,
        this.geoCodingInfo,
      );
    });

    Array.from(this.querySelectorAll('.mdc-checkbox')).forEach(elem => {
      // eslint-disable-next-line no-new
      new MDCCheckbox(elem);
    });

    this.carouselWrapper = this.querySelector('.fevermap-data-entry-content');
    if (this.firstTimeSubmitting) {
      setTimeout(() => {
        this.handleDialogFocus('#question-1');
      });
    } else {
      setTimeout(() => {
        this.nextQuestion(() => this.handleDialogFocus('#question-2'));
      });
    }
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

  // Promisifying getCurrentPosition
  getPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  async getGeoLocationInfo(forceUpdate) {
    if (!this.geoCodingInfo || forceUpdate) {
      const success = await this.getPosition();
      this.geoCodingInfo = await GeolocatorService.getGeoCodingInfo(
        success.coords.latitude,
        success.coords.longitude,
      );

      delete this.geoCodingInfo.success;

      const countryInSelect = this.countrySelectionOptions.find(
        opt => opt.id === this.geoCodingInfo.countryShort,
      );
      if (countryInSelect) {
        this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
      }

      this.performUpdate();
      if (forceUpdate) {
        SnackBar.success(Translator.get('system_messages.success.location_update'));
      }
      return Promise.resolve();
    }
    const countryInSelect = this.countrySelectionOptions.find(
      opt => opt.id === this.geoCodingInfo.countryShort,
    );
    if (countryInSelect) {
      this.selectedCountryIndex = this.countrySelectionOptions.indexOf(countryInSelect) + 1; // Take into account the empty option
    }
    return Promise.resolve();
  }

  handleFeverButton(hasFever) {
    this.hasFever = hasFever;
    if (this.hasFever) {
      setTimeout(() => {
        const slider = this.initSlider();

        const checkboxElem = this.querySelector('.mdc-checkbox');
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
    const tempMeter = this.querySelector('#temperature-meter');
    if (!tempMeter) {
      return;
    }
    const mainTempInput = this.querySelector('#temp-input-main');
    const secondaryTempInput = this.querySelector('#temp-input-secondary');

    tempMeter.addEventListener('input', e => {
      this.feverAmount = e.target.value;

      this.feverAmountInMainUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
        false,
        this.feverAmount,
        this.geoCodingInfo,
      );

      this.feverAmountInSecondaryUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
        true,
        this.feverAmount,
        this.geoCodingInfo,
      );
    });
    mainTempInput.addEventListener('keyup', e => {
      if (!e.target.value || e.key === 'Tab' || e.key === '.' || e.key === ',') {
        return;
      }
      // feveramount is always in celsius
      this.feverAmount = FeverDataUtil.useFahrenheit(this.geoCodingInfo)
        ? FeverDataUtil.fahrenheitToCelsius(e.target.value)
        : e.target.value;
      this.feverAmountInSecondaryUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
        true,
        this.feverAmount,
        this.geoCodingInfo,
      );
    });
    secondaryTempInput.addEventListener('keyup', e => {
      if (!e.target.value || e.key === 'Tab' || e.key === '.' || e.key === ',') {
        return;
      }
      // feveramount is always in celsius
      this.feverAmount = FeverDataUtil.useFahrenheit(this.geoCodingInfo)
        ? e.target.value
        : FeverDataUtil.fahrenheitToCelsius(e.target.value);

      this.feverAmountInMainUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
        false,
        this.feverAmount,
        this.geoCodingInfo,
      );
    });

    mainTempInput.addEventListener('blur', e => {
      const val = e.target.value;
      if (val.length < 1) {
        this.feverAmountInMainUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
          false,
          this.feverAmount,
          this.geoCodingInfo,
        );
        e.target.value = this.feverAmountInMainUnit;
      }
    });

    secondaryTempInput.addEventListener('blur', e => {
      const val = e.target.value;
      if (val.length < 1) {
        this.feverAmountInSecondaryUnit = FeverDataUtil.getFeverWithUnitWithoutSuffix(
          true,
          this.feverAmount,
          this.geoCodingInfo,
        );
        e.target.value = this.feverAmountInSecondaryUnit;
      }
    });

    mainTempInput.addEventListener('focus', e => {
      e.target.select();
    });

    secondaryTempInput.addEventListener('focus', e => {
      e.target.select();
    });
    // Programmatically set height of the temp meter
    setTimeout(() => {
      tempMeter.style.width = `${tempMeter.parentNode.clientHeight}px`;
    }, 0);
  }

  // Quite hacky but should work
  // eslint-disable-next-line class-methods-use-this
  handleCommaInput(e) {
    if (e.key === ',') {
      e.target.setAttribute('comma-was-input', true);
      e.target.value += '.0';
    } else if (e.target.getAttribute('comma-was-input')) {
      e.target.removeAttribute('comma-was-input');
      if (!Number.isNaN(e.key)) {
        // is number
        const oldVal = e.target.value;
        e.target.value = `${oldVal.split('.')[0]}.${e.key}`;
      }
    }
  }

  async buildFeverData() {
    const feverData = {};
    const geoCodingInfo = await this.getGeoCodingInputInfo();
    // device ID is handled during submission
    feverData.fever_status = this.hasFever;
    feverData.fever_temp = this.feverAmount;
    if (this.hasFever) {
      feverData.fever_temp = !this.feverAmountNotKnown && this.hasFever ? this.feverAmount : null;
    }
    feverData.birth_year = this.birthYear;
    feverData.gender = this.gender;

    feverData.location_country_code = geoCodingInfo.country_code;
    feverData.location_postal_code = geoCodingInfo.postal_code;
    feverData.location_lng = geoCodingInfo.location_lng.toFixed(7);
    feverData.location_lat = geoCodingInfo.location_lat.toFixed(7);

    const possibleSymptoms = [
      'symptom_difficult_to_breath',
      'symptom_cough',
      'symptom_sore_throat',
      'symptom_muscle_pain',
    ];
    possibleSymptoms.forEach(symp => {
      feverData[symp] = this.symptoms.includes(symp);
    });

    feverData.diagnosed_covid19 = this.covidDiagnosed;

    return feverData;
  }

  validateFeverData(feverData) {
    const ageIsValid = this.validateAge(feverData.birth_year);
    if (!ageIsValid) {
      return false;
    }
    const genderIsValid = this.validateGender(feverData.gender);
    if (!genderIsValid) {
      return false;
    }
    const feverTempIsValid = this.validateFeverTemp(feverData.fever_temp);
    if (!feverTempIsValid) {
      return false;
    }
    const locationIsValid = this.validateLocation(feverData);
    if (!locationIsValid) {
      return false;
    }
    return true;
  }

  validateAge(birthYear) {
    if (birthYear > 2020 || birthYear < 1900) {
      this.errorMessage = Translator.get('system_messages.error.age_not_in_range');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateGender(gender) {
    if (gender === null) {
      this.errorMessage = Translator.get('system_messages.error.gender_not_set');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateFeverTemp(feverTemp) {
    if (feverTemp != null && (feverTemp < 35 || feverTemp > 44)) {
      this.errorMessage = Translator.get('system_messages.error.fever_temp_value_invalid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  validateLocation(feverData) {
    if (this.locationDataIsInvalid(feverData)) {
      this.errorMessage = Translator.get('system_messages.error.location_data_invalid');
      SnackBar.error(this.errorMessage);
      return false;
    }
    return true;
  }

  locationDataIsInvalid(feverData) {
    return (
      !feverData.location_country_code ||
      !feverData.location_postal_code ||
      !feverData.location_lng ||
      !feverData.location_lat
    );
  }

  async handleSubmit() {
    const feverData = await this.buildFeverData();
    const valid = this.validateFeverData(feverData);
    if (!valid) {
      return;
    }
    this.errorMessage = null;

    const submissionResponse = await DataEntryService.handleDataEntrySubmission(feverData);

    if (submissionResponse.success) {
      this.handlePostSubmissionActions(feverData, Date.now(), false, submissionResponse);
      this.currentQuestion = 1;
    } else {
      switch (submissionResponse.reason) {
        case 'INVALID_DATA':
          SnackBar.error(Translator.get('system_messages.error.api_data_invalid'));
          break;
        case 'REGEN_DEVICE_ID':
          this.handlePostSubmissionActions(feverData, Date.now(), true);
          break;
        case 'NETWORK_STATUS_OFFLINE':
          this.handlePostSubmissionActions(feverData, Date.now(), true);
          break;
        default:
          SnackBar.error(submissionResponse.message);
      }
    }
  }

  async handlePostSubmissionActions(feverData, submissionTime, entryGotQueued, submissionResponse) {
    localStorage.setItem('LATEST_ENTRY', JSON.stringify(feverData));
    localStorage.setItem('GENDER', feverData.gender);
    localStorage.setItem('BIRTH_YEAR', feverData.birth_year);
    localStorage.setItem('COVID_DIAGNOSIS', feverData.diagnosed_covid19);
    localStorage.setItem('LAST_ENTRY_SUBMISSION_TIME', submissionTime);
    localStorage.setItem('LOCATION_COUNTRY', feverData.location_country_code);

    if (!entryGotQueued) {
      DataEntryService.setEntriesToIndexedDb(submissionResponse);
      SnackBar.success(Translator.get('system_messages.success.data_entry'));

      GoogleAnalyticsService.reportSubmission();
      PWAService.launchInstallDialog();
      this.closeView();
      syncClientInformation();
      if (NotificationService.isMessagingSupported()) {
        NotificationService.createNotificationRequestDialog();
      }
    } else {
      document.dispatchEvent(new CustomEvent('update-queued-count'));
      SnackBar.success(Translator.get('system_messages.success.entry_send_failed_queued'));
      this.closeView();
    }
    ScrollService.scrollToTop();
  }

  closeView() {
    const wrapper = this.querySelector('.view-wrapper');
    wrapper.classList.add('fevermap-entry-dialog--hidden');
    wrapper.addEventListener('transitionend', () => {
      this.remove();
    });
  }

  /**
   * Enable this if we start allowing offline sync.
   *
   * Needs changes to the IDB code
   * @return {Promise<void>}
   */
  async submitQueuedEntries() {
    const db = await DBUtil.getInstance();
    let successfulSyncCount = 0;
    await this.queuedEntries.map(async (entry, i) => {
      const { id } = entry;
      // delete entry.id;
      const submissionResponse = await DataEntryService.handleDataEntrySubmission(entry, false);
      if (submissionResponse.success) {
        db.delete(QUEUED_ENTRIES, id);
        await db.add(FEVER_ENTRIES, entry);
        successfulSyncCount += 1;
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

  async getGeoCodingInputInfo() {
    const postalCode = this.querySelector('#location-postal-code').getValue();
    const country = this.querySelector('#location-country').getValue();

    const geoCodingInfo = await GeolocatorService.getGeoCodingInfoByPostalCodeAndCountry(
      postalCode,
      country.value.id,
    );
    localStorage.setItem('LAST_LOCATION', JSON.stringify(geoCodingInfo));

    if (!geoCodingInfo.countryShort || !geoCodingInfo.coords || !geoCodingInfo.postal_code) {
      SnackBar.error(Translator.get('system_messages.error.location_data_invalid'));
      return null;
    }

    return {
      country_code: geoCodingInfo.countryShort,
      location_lat: geoCodingInfo.coords.lat,
      location_lng: geoCodingInfo.coords.lng,
      postal_code: geoCodingInfo.postal_code,
    };
  }

  handlePersonalInfoSubmit() {
    if (!this.validateAge(this.birthYear) || !this.validateGender(this.gender)) {
      return;
    }
    this.nextQuestion(() => this.handleDialogFocus('#question-2'));
  }

  handleFeverInfoSubmit() {
    this.nextQuestion(() => this.handleDialogFocus('#question-3'));
  }

  handleUnmeasuredFeverSubmit(hasFever) {
    this.hasFever = hasFever;
    this.feverAmount = null;
    this.nextQuestion(() => this.handleDialogFocus('#question-3'));
    if (!hasFever) {
      // Skip symptoms
      this.nextQuestion(() => this.handleDialogFocus('#question-4'));
    }
  }

  handleSymptomSubmit() {
    this.covidDiagnosed = this.querySelector('#covid-diagnosed').checked;
    this.nextQuestion(() => this.handleDialogFocus('#question-4'));
  }

  previousQuestion(callback) {
    if (this.currentQuestion === 1) {
      return;
    }
    this.currentQuestion -= 1;
    this.scrollToCurrentQuestion(false, callback);
  }

  nextQuestion(callback) {
    if (this.currentQuestion === this.questionCount || this.transitioning) {
      return;
    }
    this.transitioning = true;
    this.currentQuestion += 1;
    this.scrollToCurrentQuestion(true, callback);
  }

  scrollToCurrentQuestion(forwards = true, callback) {
    const targetElem = this.querySelector(`#question-${this.currentQuestion}`);
    if (!targetElem) {
      return;
    }
    const target = targetElem.offsetLeft - (window.innerWidth - targetElem.clientWidth) / 2;
    this.smoothScroll(this.carouselWrapper, target, forwards, callback);
    this.transitioning = false;
  }

  smoothScroll(div, target, forwards = true, callback) {
    // Tickrate will determine the amount of iterations + 1 that the scrolling will do
    // To speed things up, change the division value. Smaller is faster.
    const tickRate = Math.abs(target - div.scrollLeft) / 30;
    if (forwards) {
      (function smoothScroll(_this) {
        if (div.scrollLeft >= target) {
          callback.call();
          return;
        }
        div.scroll(div.scrollLeft + tickRate, 0);
        setTimeout(() => smoothScroll(_this), 10);
      })(this);
    } else {
      if (target < 0) {
        // eslint-disable-next-line no-param-reassign
        target = 0;
      }
      (function smoothScrollBackwards(_this) {
        if (div.scrollLeft <= target) {
          if (callback) {
            callback.call();
          }
          return;
        }
        div.scroll(div.scrollLeft - tickRate, 0);
        setTimeout(() => smoothScrollBackwards(_this), 10);
      })(this);
    }
  }

  handleDialogFocus(dialogId) {
    this.querySelector(dialogId).focus();
    tabtrap.trapAll(dialogId);
  }

  handleSymptomKeyDown(e) {
    if (e.code === 'Space') {
      this.handleSymptomAdd(e);
    }
  }

  handleSymptomAdd(e) {
    let { target } = e;
    if (target.nodeName === 'P') {
      target = target.parentNode;
    }
    if (this.symptoms.includes(target.id)) {
      this.symptoms.splice(this.symptoms.indexOf(target.id), 1);
      target.classList.remove('symptom--selected');
    } else {
      this.symptoms.push(target.id);
      target.classList.add('symptom--selected');
    }
  }

  getBirthYearRanges() {
    return [
      { name: '1900-1909', value: '1900' },
      { name: '1910-1919', value: '1910' },
      { name: '1920-1929', value: '1920' },
      { name: '1930-1939', value: '1930' },
      { name: '1940-1949', value: '1940' },
      { name: '1950-1959', value: '1950' },
      { name: '1960-1969', value: '1960' },
      { name: '1970-1979', value: '1970' },
      { name: '1980-1989', value: '1980' },
      { name: '1990-1999', value: '1990' },
      { name: '2000-2009', value: '2000' },
      { name: '2010-2019', value: '2010' },
    ];
  }

  render() {
    return html`
      <div class="container view-wrapper fevermap-entry-dialog fevermap-entry-dialog--hidden">
        <div class="fevermap-data-entry-content">
          <div
            class="fevermap-entry-carousel${this.questionCount === 4
              ? ' fevermap-entry-carousel--full-width'
              : ' fevermap-entry-carousel--smaller-width'}"
          >
            ${this.renderQuestions()}
          </div>
        </div>
      </div>
    `;
  }

  renderQuestions() {
    return html`
      <div class="entry-dialog-close-button">
        <material-icon @click="${this.closeView}" icon="close"></material-icon>
      </div>
      <div class="fevermap-entry-window mdc-elevation--z9" id="question-1" tabindex="0">
        ${this.getPersonalQuestions()}
      </div>
      <div
        class="fevermap-entry-window mdc-elevation--z9 fevermap-fever-questions"
        id="question-2"
        tabindex="0"
      >
        ${this.getFeverMeter()}
      </div>
      <div
        class="fevermap-entry-window mdc-elevation--z9 fevermap-other-symptoms-questions"
        id="question-3"
        tabindex="0"
      >
        ${this.getSymptomsFields()}
      </div>
      <div
        class="fevermap-entry-window mdc-elevation--z9 fevermap-location-questions"
        id="question-4"
        tabindex="0"
      >
        ${this.getGeoLocationInput()}
      </div>
    `;
  }

  getPersonalQuestions() {
    return html`
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="subtitle">${Translator.get('entry.first_time_disclaimer')}</p>
        <p class="subtitle">${Translator.get('entry.these_questions_wont_be_repeated')}</p>
      </div>
      <div class="question-number-holder">
        1/${this.questionCount}
      </div>
      ${this.getYearOfBirthInput()} ${this.getGenderInput()}
      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handlePersonalInfoSubmit}">
          <div class="mdc-button__ripple"></div>

          <i class="material-icons mdc-button__icon" aria-hidden="true">save</i>
          <span class="mdc-button__label">${Translator.get('entry.save')}</span>
        </button>
      </div>
    `;
  }

  getFeverMeter() {
    return html`
      <div
        class="back-button"
        @click="${() => this.previousQuestion(() => this.handleDialogFocus('#question-1'))}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="question-number-holder">
        2/${this.questionCount}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="temperature-title">
          ${Translator.get('entry.questions.what_is_your_temperature')}
        </p>
      </div>
      <div class="entry-field fever-meter-field">
        <div class="fever-meters">
          <div class="fever-slider">
            <div class="fever-amount-display">
              <div class="fever-amount-field  mdc-elevation--z3">
                <input
                  id="temp-input-main"
                  type="number"
                  step="0.1"
                  .value="${this.feverAmountInMainUnit}"
                />
                <p>${FeverDataUtil.getFeverUnitSuffix(false, this.geoCodingInfo)}</p>
              </div>
            </div>
            <div class="fever-slider-element">
              <input
                type="range"
                id="temperature-meter"
                min="35"
                max="42"
                step="0.1"
                .value="${this.feverAmount}"
                tabindex="-1"
              />
            </div>
            <div class="fever-amount-display">
              <div class="fever-amount-field  mdc-elevation--z3">
                <input
                  type="number"
                  step="0.1"
                  id="temp-input-secondary"
                  .value="${this.feverAmountInSecondaryUnit}"
                />
                <p>${FeverDataUtil.getFeverUnitSuffix(true, this.geoCodingInfo)}</p>
              </div>
            </div>
          </div>

          <div class="proceed-button">
            <button
              class="mdc-button mdc-button--raised"
              @click="${() => this.handleFeverInfoSubmit()}"
            >
              <div class="mdc-button__ripple"></div>

              <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
              <span class="mdc-button__label"
                >${Translator.get('entry.questions.set_temperature')}</span
              >
            </button>
          </div>
          <div class="fever-not-measured-prompt">
            <p>${Translator.get('entry.questions.havent_measured_but')}</p>
            <div class="fever-not-measured-buttons">
              <div class="fever-not-measured-buttons--feverish">
                <material-button
                  @click="${() => this.handleUnmeasuredFeverSubmit(true)}"
                  class="mdc-elevation--z3"
                  icon="sentiment_very_dissatisfied"
                  label="${Translator.get('entry.questions.feel_feverish')}"
                ></material-button>
              </div>
              <div class="fever-not-measured-buttons--healthy">
                <material-button
                  @click="${() => this.handleUnmeasuredFeverSubmit(false)}"
                  class="mdc-elevation--z3"
                  icon="sentiment_very_satisfied"
                  label="${Translator.get('entry.questions.feel_healthy')}"
                ></material-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getSymptomsFields() {
    return html`
      <div
        class="back-button"
        @click="${() => this.previousQuestion(() => this.handleDialogFocus('#question-2'))}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="question-number-holder">
        3/${this.questionCount}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p class="symptoms-title">${Translator.get('entry.questions.other_symptoms')}</p>
      </div>
      <p class="subtitle">${Translator.get('entry.questions.choose_all_that_apply')}</p>
      <div class="symptom-holder">
        <div
          class="symptom"
          id="symptom_difficult_to_breath"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.difficulty_to_breathe')}</p>
        </div>

        <div
          class="symptom"
          id="symptom_cough"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.cough')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_sore_throat"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.sore_throat')}</p>
        </div>
        <div
          class="symptom"
          id="symptom_muscle_pain"
          @keypress="${this.handleSymptomKeyDown}"
          @click="${this.handleSymptomAdd}"
          tabindex="0"
        >
          <p>${Translator.get('entry.questions.muscular_pain')}</p>
        </div>
      </div>

      <div class="mdc-form-field">
        <div class="mdc-checkbox">
          <input
            type="checkbox"
            class="mdc-checkbox__native-control"
            id="covid-diagnosed"
            ?checked="${this.covidDiagnosed}"
          />
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
        <label for="covid-diagnosed"
          >${Translator.get('entry.questions.positive_covid_diagnosis')}</label
        >
      </div>
      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handleSymptomSubmit}">
          <div class="mdc-button__ripple"></div>

          <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
          <span class="mdc-button__label">${Translator.get('entry.questions.set_symptoms')}</span>
        </button>
      </div>
    `;
  }

  getGeoLocationInput() {
    return html`
      <div
        class="back-button"
        @click="${() => this.previousQuestion(() => this.handleDialogFocus('#question-3'))}"
      >
        <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
      </div>
      <div class="question-number-holder">
        4/${this.questionCount}
      </div>
      <div class="title-holder">
        <h2>${Translator.get('entry.new_entry')}</h2>
        <p>${Translator.get('entry.questions.whats_your_location')}</p>
      </div>
      <div class="entry-field">
        <div class="location-select-fields">
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
        </div>
        <p class="subtitle">
          ${Translator.get('entry.questions.location_change_subtitle')}
        </p>
        <div class="geolocation-button">
          <button
            class="mdc-button mdc-button--outlined"
            @click="${() => this.getGeoLocationInfo(true)}"
          >
            <div class="mdc-button__ripple"></div>

            <i class="material-icons mdc-button__icon" aria-hidden="true">my_location</i>
            <span class="mdc-button__label">${Translator.get('entry.questions.use_gps')}</span>
          </button>
        </div>
      </div>
      <div class="proceed-button">
        <button class="mdc-button mdc-button--raised" @click="${this.handleSubmit}">
          <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
          <span class="mdc-button__label"
            >${Translator.get('entry.questions.set_location_and_submit')}</span
          >
        </button>
      </div>
    `;
  }

  getYearOfBirthInput() {
    return html`
      <div class="entry-field">
        <p>${Translator.get('entry.questions.birth_year')}</p>
        <div class="birth-year-range-selectors">
          ${BirthYearRangeSelector.getBirthYearRanges().map(
            range =>
              html`
                <birth-year-range-selector
                  @birth-year-selected="${e => {
                    this.birthYear = e.detail.birthYear;
                  }}"
                  label=${range.name}
                  value=${range.value}
                  ?selected="${this.birthYear === range.value}"
                ></birth-year-range-selector>
              `,
          )}
        </div>
      </div>
    `;
  }

  getGenderInput() {
    return html`
      <div class="entry-field">
        <p>${Translator.get('entry.questions.gender_in_passport')}</p>
        <gender-input
          gender="${this.gender}"
          @gender-changed="${e => {
            this.gender = e.detail.gender;
          }})}"
        ></gender-input>
      </div>
    `;
  }

  getSubmitButton() {
    return html`
      <div class="entry-field">
        ${this.errorMessage ? html` <p class="mdc-theme--error">${this.errorMessage}</p> ` : ''}
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

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fevermap-data-entry')) {
  customElements.define('fevermap-data-entry', FevermapDataEntry);
}
