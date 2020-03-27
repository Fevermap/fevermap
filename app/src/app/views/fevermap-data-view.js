import { LitElement, html } from 'lit-element';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Translator from '../util/translator';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util';
import GeolocatorService from '../services/geolocator-service';
import FeverDataUtil from '../util/fever-data-util';
import 'src/app/components/fever-chart';

class FevermapDataView extends LitElement {
    static get properties() {
        return {
            lastSubmissionTime: { type: String },
            submissionCount: { type: Number },
            submissionStreak: { type: Number },
            previousSubmissions: { type: Array },
            geoCodingInfo: { type: Object },
            firstTimeSubmitting: { type: Boolean },

            setGender: { type: String },
            setBirthYear: { type: String },
            setCovidDiagnosis: { type: Boolean },
            showEditFields: { type: Boolean },
        };
    }

    constructor() {
        super();

        let submissionCount = localStorage.getItem('SUBMISSION_COUNT');
        let submissionStreak = localStorage.getItem('SUBMISSION_STREAK');
        this.submissionCount = submissionCount ? submissionCount : 0;
        this.submissionStreak = submissionStreak ? submissionStreak : 0;
        dayjs.extend(utc);

        let lastEntryTime = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
        if (lastEntryTime && lastEntryTime !== 'undefined') {
            this.lastSubmissionTime = dayjs(Number(lastEntryTime)).format('DD-MM-YYYY : HH:mm');
        }

        const gender = localStorage.getItem('GENDER');
        const birthYear = localStorage.getItem('BIRTH_YEAR');
        const covidDiagnosis = localStorage.getItem('COVID_DIAGNOSIS');
        this.setGender = gender ? gender : null;
        this.setBirthYear = birthYear ? birthYear : '';
        this.setCovidDiagnosis = covidDiagnosis === 'true';
        this.previousSubmissions = null;
        this.showEditFields = false;

        this.firstTimeSubmitting = this.setGender == null || this.setBirthYear == null;

        this.getPreviousSubmissionsFromIndexedDb();
    }

    firstUpdated(_changedProperties) {
        this.getGeoLocationInfo();
        document.addEventListener('update-submission-list', () => {
            this.getPreviousSubmissionsFromIndexedDb();

            let submissionCount = localStorage.getItem('SUBMISSION_COUNT');
            let submissionStreak = localStorage.getItem('SUBMISSION_STREAK');

            this.setGender = localStorage.getItem('GENDER');
            this.setBirthYear = localStorage.getItem('BIRTH_YEAR');
            this.setCovidDiagnosis = localStorage.getItem('COVID_DIAGNOSIS');

            this.submissionCount = submissionCount ? submissionCount : 0;
            this.submissionStreak = submissionStreak ? submissionStreak : 0;
        });
        if (this.firstTimeSubmitting) {
            this.showEntryDialog();
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
            });
        }
    }

    async getPreviousSubmissionsFromIndexedDb() {
        let db = await DBUtil.getInstance();
        const previousSubmissions = await db.getAll(FEVER_ENTRIES);
        if (previousSubmissions && previousSubmissions.length > 0) {
            this.previousSubmissions = previousSubmissions.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );
        } else {
            this.previousSubmissions = [];
        }
    }

    showEntryDialog() {
        let dataEntryDialog = document.createElement('fevermap-data-entry');
        document.querySelector('fevermap-root').appendChild(dataEntryDialog);
        setTimeout(() => {
            dataEntryDialog.querySelector('.view-wrapper').classList.remove('fevermap-entry-dialog--hidden');
        });
    }

    // For use when we enable offline
    async getQueuedEntriesFromIndexedDb() {
        let db = await DBUtil.getInstance();
        const queuedSubmissions = await db.getAll(QUEUED_ENTRIES);
        if (queuedSubmissions && queuedSubmissions.length > 0) {
            this.queuedEntries = queuedSubmissions;
        }
    }

    getSymptomsForSubmission(sub) {
        const symptoms = [
            {
                translation: Translator.get('entry.questions.difficulty_to_breathe'),
                hasSymptom: sub.symptom_difficult_to_breath,
            },
            {
                translation: Translator.get('entry.questions.cough'),
                hasSymptom: sub.symptom_cough,
            },
            {
                translation: Translator.get('entry.questions.sore_throat'),
                hasSymptom: sub.symptom_sore_throat,
            },
            {
                translation: Translator.get('entry.questions.muscular_pain'),
                hasSymptom: sub.symptom_muscle_pain,
            },
        ];
        return symptoms.filter(symp => symp.hasSymptom);
    }

    handleGenderChange(newGender) {
        this.setGender = newGender;
        localStorage.setItem('GENDER', newGender);
    }

    getAge() {
        let age = dayjs(new Date()).year() - this.setBirthYear;
        return `${age - 1}-${age}`;
    }

    handleAgeChange(newAge) {
        if (newAge < 1900 || newAge > 2020) {
            return;
        }
        this.setBirthYear = newAge;
        localStorage.setItem('BIRTH_YEAR', newAge);
    }

    handleCovidDiagnosisChange() {
        this.setCovidDiagnosis = this.querySelector('#covid-diagnosed').checked;
        localStorage.setItem('COVID_DIAGNOSIS', this.setCovidDiagnosis);
    }

    smoothScrollToTop() {
        (function scrollToTop() {
            if (document.body.scrollTop > 0) {
                document.body.scrollTop -= 10;
                setTimeout(scrollToTop, 5);
            }
        })();
    }

    render() {
        return html`
            <div class="container view-wrapper fevermap-entry-view">
                <div class="fevermap-data-view-content">
                    <div class="entry-history-title-area">
                        <h2>${Translator.get('history.title')}</h2>
                        <material-button
                            @button-clicked="${this.showEntryDialog}"
                            class="add-new-entry-button"
                            icon="add_circle"
                            label="${Translator.get('history.add_entry')}"
                        ></material-button>
                    </div>
                    <div class="entry-info-view-wrapper">
                        <div class="progression-chart">
                            <fever-chart
                                .data="${this.previousSubmissions}"
                                chartId="fever-history-chart"
                            ></fever-chart>
                        </div>
                        <div class="statistics-fields">
                            <div class="statistics-field statistics-field--streak-statistics">
                                <p class="statistics-field--title">${Translator.get('history.your_streak')}</p>
                                <p class="statistics-field--result">${this.submissionStreak}</p>
                                <p class="statistics-field--subtitle">${Translator.get('history.days')}</p>
                            </div>
                            <div class="statistics-fields--splitter"></div>
                            <div class="statistics-field statistics-field--total-statistics">
                                <p class="statistics-field--title">${Translator.get('history.total_entries')}</p>
                                <p class="statistics-field--result">${this.submissionCount}</p>
                                <p class="statistics-field--subtitle">${Translator.get('history.measurements')}</p>
                            </div>
                        </div>
                        ${this.createPersistentDataFields()}
                        <div class="previous-submissions-list">
                            ${this.previousSubmissions &&
                                this.previousSubmissions.map((sub, i) => {
                                    let previousSubmission = this.previousSubmissions[i + 1]; // +1 because we're going from latest
                                    let symptoms = this.getSymptomsForSubmission(sub);
                                    return html`
                                        <div class="previous-submission">
                                            <div class="previous-submission--data-row">
                                                <p class="previous-submission--data-row__date">
                                                    ${dayjs
                                                        .utc(sub.timestamp)
                                                        .local()
                                                        .format('ddd DD.MM HH:mm')}
                                                </p>
                                                <p class="previous-submission--data-row__fever">
                                                    ${previousSubmission && sub.fever_temp
                                                        ? html`
                                                              ${previousSubmission.fever_temp === sub.fever_temp
                                                                  ? html`
                                                                        <material-icon
                                                                            class="no-new-trend"
                                                                            icon="arrow_right_alt"
                                                                        ></material-icon>
                                                                    `
                                                                  : html`
                                                                        ${previousSubmission.fever_temp > sub.fever_temp
                                                                            ? html`
                                                                                  <material-icon
                                                                                      class="downward-trend"
                                                                                      icon="call_received"
                                                                                  ></material-icon>
                                                                              `
                                                                            : html`
                                                                                  <material-icon
                                                                                      class="upward-trend"
                                                                                      icon="call_made"
                                                                                  ></material-icon>
                                                                              `}
                                                                    `}
                                                          `
                                                        : ''}
                                                    ${sub.fever_temp
                                                        ? `${FeverDataUtil.getFeverWithUnit(
                                                              false,
                                                              sub.fever_temp,
                                                              this.geoCodingInfo
                                                          )}`
                                                        : '-'}
                                                </p>
                                            </div>
                                            <div class="previous-submission--symptom-row">
                                                <div class="previous-submission--symptom-row__symptoms">
                                                    ${symptoms.map((symp, i) => {
                                                        return html`
                                                            ${symp.hasSymptom
                                                                ? html`
                                                                      <p>
                                                                          ${symp.translation}${i < symptoms.length - 1
                                                                              ? ', '
                                                                              : ''}
                                                                      </p>
                                                                  `
                                                                : ''}
                                                        `;
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                })}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getGenderTranslated() {
        return this.setGender === 'M'
            ? Translator.get('entry.questions.male').toLowerCase()
            : Translator.get('entry.questions.female').toLowerCase();
    }

    getCovidStatusTranslated() {
        return this.setCovidDiagnosis ? Translator.get('a_covid_diagnosis') : Translator.get('no_covid_diagnosis');
    }

    createPersistentDataFields() {
        if (!this.setBirthYear && !this.setGender) {
            return html``;
        }
        return html`
            <div class="persistent-info-fields">
                <p>
                ${Translator.get('user_description', {
                    age: this.getAge(),
                    gender: this.getGenderTranslated(),
                    diagnosis: this.getCovidStatusTranslated(),
                })}.
                </p>
                <material-icon icon="edit" @click="${() =>
                    (this.showEditFields = !this.showEditFields)}"></material-icon>
            </div>
            <div class="persistent-info-editing-fields ${
                this.showEditFields ? '' : ' persistent-info-editing-fields--hidden'
            }"">
                <div class="persistent-info-editing-fields--age-input">
                    <p>${Translator.get('entry.questions.birth_year')}</p>
                    <input-field
                        @input-blur="${e => this.handleAgeChange(e.detail.age)}"
                        placeHolder=${Translator.get('entry.questions.birth_year_placeholder')}
                        fieldId="year-of-birth-input"
                        id="birth-year"
                        value="${this.setBirthYear}"
                        type="number"
                    ></input-field>
                </div>

                <div class="persistent-info-editing-fields--gender-input">
                    <p>${Translator.get('entry.questions.gender_in_passport')}</p>
                    <gender-input
                        gender="${this.setGender}"
                        @gender-changed="${e => this.handleGenderChange(e.detail.gender)}"
                    ></gender-input>
                </div>
                <p>${Translator.get('entry.questions.positive_covid_diagnosis')}</p>
                <div
                    class="persistent-info-editing-fields--covid-input"
                    @click="${() => this.handleCovidDiagnosisChange()}"
                >
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
                        <label for="checkbox-1">${Translator.get('entry.questions.positive_covid_diagnosis')}</label>
                    </div>
                </div>
                <div class="persistent-info-editing-fields--submit-button">
                <material-button 
                @click="${() => {
                    this.showEditFields = false;
                    this.smoothScrollToTop();
                }}"
                icon="save"
                label="${Translator.get('entry.save')}"></material-button></div>
            </div>
        `;
    }

    createRenderRoot() {
        return this;
    }
}

if (!customElements.get('fevermap-data-view')) {
    customElements.define('fevermap-data-view', FevermapDataView);
}
