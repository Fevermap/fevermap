import { LitElement, html } from 'lit-element';
import { MDCCheckbox } from '@material/checkbox/component';
import maleIcon from 'src/assets/images/male.svg';
import femaleIcon from 'src/assets/images/female.svg';
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

            submissionCount: { type: Number },
            submissionStreak: { type: Number },
        };
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
        this.feverAmount = 35;
        this.feverAmountNotKnown = false;
        this.birthYear = latestEntry ? latestEntry.birth_year : null;
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

        this.currentQuestion = 1;
        this.questionCount = 4;
        this.symptoms = [];

        let subCount = localStorage.getItem('SUBMISSION_COUNT');
        let subStreak = localStorage.getItem('SUBMISSION_STREAK');
        this.submissionCount = subCount ? subCount : 0;
        this.submissionStreak = subStreak ? subStreak : 0;
    }

    firstUpdated(_changedProperties) {
        this.getPreviousSubmissionsFromIndexedDb();
        /*this.getQueuedEntriesFromIndexedDb();*/
        this.initSlider();
        this.getGeoLocationInfo();
        this.carouselWrapper = this.querySelector('.fevermap-data-entry-content');
        if (!this.firstTimeSubmitting) {
            setTimeout(() => {
                this.nextQuestion();
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

    async getPreviousSubmissionsFromIndexedDb() {
        let db = await DBUtil.getInstance();
        const previousSubmissions = await db.getAll(FEVER_ENTRIES);
        console.log(previousSubmissions);
        if (previousSubmissions && previousSubmissions.length > 0) {
            this.previousSubmissions = previousSubmissions.sort((a, b) => b.submission_time - a.submission_time);
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
        return !!reverse ^ this.useFahrenheit()
            ? this.celsiusToFahrenheit(feverValue) + ' °F'
            : Number(feverValue).toFixed(1) + ' °C';
    }

    initSlider() {
        let tempMeter = this.querySelector('#temperature-meter');
        if (!tempMeter) {
            return;
        }
        tempMeter.addEventListener('input', e => {
            this.feverAmount = e.target.value;
        });
        // Programmatically set height of the temp meter
        setTimeout(() => {
            tempMeter.style.width = tempMeter.parentNode.clientHeight + 'px';
        }, 0);
    }

    async buildFeverData() {
        let feverData = {};
        let geoCodingInfo = await this.getGeoCodingInputInfo();
        let device_id = localStorage.getItem('DEVICE_ID');
        if (!device_id) {
            device_id = Date.now();
            localStorage.setItem('DEVICE_ID', device_id);
        }

        feverData.device_id = device_id;
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
            'symptom_difficult_to_breathe',
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
        if (feverData.birth_year > 2020 || feverData.birth_year < 1900) {
            this.errorMessage = Translator.get('system_messages.error.age_not_in_range');
            SnackBar.error(this.errorMessage);
            return false;
        }

        if (feverData.gender === null) {
            this.errorMessage = Translator.get('system_messages.error.gender_not_set');
            SnackBar.error(this.errorMessage);
            return false;
        }

        if (feverData.fever_temp != null && (feverData.fever_temp < 35 || feverData.fever_temp > 44)) {
            this.errorMessage = Translator.get('system_messages.error.fever_temp_value_invalid');
            SnackBar.error(this.errorMessage);
            return false;
        }
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
        let feverData = await this.buildFeverData();
        let valid = this.validateFeverData(feverData);
        if (!valid) {
            return;
        }
        this.errorMessage = null;

        const submissionResponse = await DataEntryService.handleDataEntrySubmission(feverData);

        if (submissionResponse.success || true) {
            this.handlePostSubmissionActions(feverData, Date.now(), false, submissionResponse);
            this.currentQuestion = 1;
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

    async handlePostSubmissionActions(feverData, submissionTime, entryGotQueued, submissionResponse) {
        localStorage.setItem('LATEST_ENTRY', JSON.stringify(feverData));
        localStorage.setItem('LAST_ENTRY_SUBMISSION_TIME', submissionTime);

        this.lastSubmissionTime = dayjs(Number(submissionTime)).format('DD-MM-YYYY : HH:mm');
        this.lastSubmissionIsTooCloseToNow = true;

        if (!entryGotQueued) {
            const db = await DBUtil.getInstance();
            feverData.submission_time = submissionTime;
            const insertSuccess = await db.add(FEVER_ENTRIES, feverData);

            if (submissionResponse && submissionResponse.history != null) {
                localStorage.setItem('SUBMISSION_COUNT', submissionResponse.history.length);
                localStorage.setItem('SUBMISSION_STREAK', submissionResponse.history.length);
            }

            this.getPreviousSubmissionsFromIndexedDb();

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

    async getGeoCodingInputInfo() {
        let postal_code = this.querySelector('#location-postal-code').getValue();
        let country = this.querySelector('#location-country').getValue();

        let geoCodingInfo = await GeolocatorService.getGeoCodingInfoByPostalCodeAndCountry(
            postal_code,
            country.value.id
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
        this.birthYear = this.querySelector('#birth-year').getValue();
        this.nextQuestion();
    }

    handleFeverInfoSubmit(noMeasurement = false) {
        if (noMeasurement) {
            this.feverAmount = null;
        }
        this.nextQuestion();
    }

    handleSymptomSubmit() {
        this.covidDiagnosed = this.querySelector('#covid-diagnosed').checked;
        this.nextQuestion();
    }

    previousQuestion() {
        if (this.currentQuestion === 1) {
            return;
        }
        this.currentQuestion--;
        this.scrollToCurrentQuestion(false);
    }

    nextQuestion() {
        if (this.currentQuestion === this.questionCount) {
            return;
        }
        this.currentQuestion++;
        this.scrollToCurrentQuestion();
    }

    scrollToCurrentQuestion(forwards = true) {
        let targetElem = this.querySelector(`#question-${this.currentQuestion}`);
        if (!targetElem) {
            return;
        }
        let target = targetElem.offsetLeft - (window.innerWidth - targetElem.clientWidth) / 2;
        this.smoothScroll(this.carouselWrapper, target, forwards);
    }

    smoothScroll(div, target, forwards = true) {
        // Tickrate will determine the amount of iterations + 1 that the scrolling will do
        // To speed things up, change the division value. Smaller is faster.
        let tickRate = Math.abs(target - div.scrollLeft) / 30;
        if (forwards) {
            (function smoothScroll() {
                if (div.scrollLeft >= target) return;
                div.scrollLeft += tickRate;
                setTimeout(smoothScroll, 10);
            })();
        } else {
            if (target < 0) {
                target = 0;
            }
            (function smoothScrollBackwards() {
                if (div.scrollLeft <= target) return;
                div.scrollLeft -= tickRate;
                setTimeout(smoothScrollBackwards, 10);
            })();
        }
    }

    handleSymptomAdd(e) {
        let target = e.target;
        if (e.target.nodeName === 'P') {
            target = target.parentNode;
        }
        if (this.symptoms.includes(e.target.id)) {
            this.symptoms.splice(this.symptoms.indexOf(e.target.id), 1);
            target.classList.remove('symptom--selected');
        } else {
            this.symptoms.push(e.target.id);
            target.classList.add('symptom--selected');
        }
    }

    render() {
        return html`
            <div class="container view-wrapper fevermap-entry-view">
                <div class="fevermap-data-entry-content">
                    ${this.lastSubmissionIsTooCloseToNow
                        ? html`
                              ${this.renderInfoView()}
                          `
                        : html`
                              <div
                                  class="fevermap-entry-carousel${this.questionCount === 4
                                      ? ' fevermap-entry-carousel--full-width'
                                      : ' fevermap-entry-carousel--smaller-width'}"
                              >
                                  ${this.renderQuestions()}
                              </div>
                          `}
                </div>
            </div>
        `;
    }

    renderInfoView() {
        return html`
            <div class="entry-info-view-wrapper">
                <h2>
                    Your last submission was done at ${this.lastSubmissionTime}
                </h2>
                <p id="submission-count-disclaimer">
                    ${Translator.get('entry.submission_count_text')}
                    <span class="green-text">${this.submissionCount}</span> ${Translator.get(
                        'entry.submission_count_times'
                    )}.
                    ${Translator.get('entry.currently_holding_a_streak_of')}
                    <span class="green-text">${this.submissionStreak}</span> ${Translator.get('entry.streak_days')}
                </p>
                <div class="previous-submissions-list">
                    <p>Previous submissions:</p>
                    ${this.previousSubmissions.map(sub => {
                        return html`
                            <div class="previous-submission">
                                <p>${dayjs(Number(sub.submission_time)).format('DD-MM-YYYY : HH:mm')}</p>
                                <p>
                                    <b>${Translator.get('entry.questions.temperature')}:</b>
                                    ${sub.fever_temp
                                        ? `${this.getFeverWithUnit()} (${this.getFeverWithUnit(true)})`
                                        : Translator.get('entry.questions.not_measured')}
                                </p>
                                <div class="previous-submission--symptoms">
                                    <p class="${sub.symptom_difficult_to_breathe ? 'symptom-true' : 'symptom-false'}">
                                        ${Translator.get('entry.questions.difficulty_to_breathe')}
                                        <material-icon
                                            icon="${sub.symptom_difficult_to_breathe ? 'done' : 'close'}"
                                        ></material-icon>
                                    </p>

                                    <p class="${sub.symptom_cough ? 'symptom-true' : 'symptom-false'}">
                                        ${Translator.get('entry.questions.cough')}
                                        <material-icon icon="${sub.symptom_cough ? 'done' : 'close'}"></material-icon>
                                    </p>

                                    <p class="${sub.symptom_sore_throat ? 'symptom-true' : 'symptom-false'}">
                                        ${Translator.get('entry.questions.sore_throat')}
                                        <material-icon
                                            icon="${sub.symptom_sore_throat ? 'done' : 'close'}"
                                        ></material-icon>
                                    </p>

                                    <p class="${sub.symptom_muscle_pain ? 'symptom-true' : 'symptom-false'}">
                                        ${Translator.get('entry.questions.muscular_pain')}
                                        <material-icon
                                            icon="${sub.symptom_muscle_pain ? 'done' : 'close'}"
                                        ></material-icon>
                                    </p>
                                </div>
                            </div>
                        `;
                    })}
                </div>
            </div>
        `;
    }

    renderQuestions() {
        return html`
            <div class="fevermap-entry-window mdc-elevation--z9" id="question-1">
                ${this.getPersonalQuestions()}
            </div>
            <div class="fevermap-entry-window mdc-elevation--z9 fevermap-fever-questions" id="question-2">
                ${this.getFeverMeter()}
            </div>
            <div class="fevermap-entry-window mdc-elevation--z9 fevermap-other-symptoms-questions" id="question-3">
                ${this.getSymptomsFields()}
            </div>
            <div class="fevermap-entry-window mdc-elevation--z9 fevermap-location-questions" id="question-4">
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
            <div class="back-button" @click="${this.previousQuestion}">
                <material-icon icon="keyboard_arrow_left"></material-icon>${Translator.get('back')}
            </div>
            <div class="question-number-holder">
                2/${this.questionCount}
            </div>
            <div class="title-holder">
                <h2>${Translator.get('entry.new_entry')}</h2>
                <p class="temperature-title">${Translator.get('entry.questions.what_is_your_temperature')}</p>
            </div>
            <div class="entry-field fever-meter-field">
                <div class="fever-meters ${this.feverAmountNotKnown ? ' fever-meters--hidden' : ''}">
                    <div class="fever-slider">
                        <div class="fever-slider-element">
                            <input type="range" id="temperature-meter" min="35" max="42" step="0.1" value="35" />
                        </div>
                    </div>
                    <div class="fever-amount-display">
                        <p class="celcius mdc-elevation--z3">${this.getFeverWithUnit()}</p>
                        <p class="fahrenheit mdc-elevation--z3">${this.getFeverWithUnit(true)}</p>
                    </div>
                </div>
                <div
                    class="mdc-form-field fever-not-measured-field ${this.feverAmountNotKnown
                        ? ' fever-not-measured-field--checked'
                        : ''}"
                >
                    <p id="dont-know-temperature" @click="${() => this.handleFeverInfoSubmit(true)}">
                        ${Translator.get('entry.questions.not_measured')}
                    </p>
                </div>
            </div>

            <div class="proceed-button">
                <button class="mdc-button mdc-button--raised" @click="${() => this.handleFeverInfoSubmit()}">
                    <div class="mdc-button__ripple"></div>

                    <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
                    <span class="mdc-button__label">${Translator.get('entry.questions.set_temperature')}</span>
                </button>
            </div>
        `;
    }

    getSymptomsFields() {
        return html`
            <div class="back-button" @click="${this.previousQuestion}">
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
                <div class="symptom" id="symptom_difficult_to_breathe" @click="${this.handleSymptomAdd}">
                    <p>${Translator.get('entry.questions.difficulty_to_breathe')}</p>
                </div>
                <div class="symptom" id="symptom_cough" @click="${this.handleSymptomAdd}">
                    <p>${Translator.get('entry.questions.cough')}</p>
                </div>
                <div class="symptom" id="symptom_sore_throat" @click="${this.handleSymptomAdd}">
                    <p>${Translator.get('entry.questions.sore_throat')}</p>
                </div>
                <div class="symptom" id="symptom_muscle_pain" @click="${this.handleSymptomAdd}">
                    <p>${Translator.get('entry.questions.muscular_pain')}</p>
                </div>
            </div>

            <div class="mdc-form-field">
                <div class="mdc-checkbox">
                    <input type="checkbox" class="mdc-checkbox__native-control" id="covid-diagnosed" />
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
                <label for="checkbox-1">${Translator.get('entry.questions.positive_covid_diagnosis')}</label>
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
            <div class="back-button" @click="${this.previousQuestion}">
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
                    <button class="mdc-button mdc-button--outlined" @click="${() => this.getGeoLocationInfo(true)}">
                        <div class="mdc-button__ripple"></div>

                        <i class="material-icons mdc-button__icon" aria-hidden="true">maps</i>
                        <span class="mdc-button__label">${Translator.get('entry.questions.use_gps')}</span>
                    </button>
                </div>
            </div>

            <div class="proceed-button">
                <button class="mdc-button mdc-button--raised" @click="${this.handleSubmit}">
                    <i class="material-icons mdc-button__icon" aria-hidden="true">done</i>
                    <span class="mdc-button__label">${Translator.get('entry.questions.set_location_and_submit')}</span>
                </button>
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

    createRenderRoot() {
        return this;
    }
}

if (!customElements.get('fevermap-data-entry')) {
    customElements.define('fevermap-data-entry', FevermapDataEntry);
}
