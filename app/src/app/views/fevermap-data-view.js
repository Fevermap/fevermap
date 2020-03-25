import { LitElement, html } from 'lit-element';
import dayjs from 'dayjs';
import Translator from '../util/translator';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util';
import GeolocatorService from '../services/geolocator-service';
import FeverDataUtil from '../util/fever-data-util';

class FevermapDataView extends LitElement {
    static get properties() {
        return {
            lastSubmissionTime: { type: String },
            submissionCount: { type: Number },
            submissionStreak: { type: Number },
            previousSubmissions: { type: Array },
            geoCodingInfo: { type: Object },
        };
    }

    constructor() {
        super();

        let submissionCount = localStorage.getItem('SUBMISSION_COUNT');
        let submissionStreak = localStorage.getItem('SUBMISSION_STREAK');
        this.submissionCount = submissionCount ? submissionCount : 0;
        this.submissionStreak = submissionStreak ? submissionStreak : 0;

        let lastEntryTime = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
        if (lastEntryTime && lastEntryTime !== 'undefined') {
            this.lastSubmissionTime = dayjs(Number(lastEntryTime)).format('DD-MM-YYYY : HH:mm');
        }

        this.getPreviousSubmissionsFromIndexedDb();
    }

    firstUpdated(_changedProperties) {
        this.getGeoLocationInfo();
        document.addEventListener('update-submission-list', () => {
            this.getPreviousSubmissionsFromIndexedDb();

            let submissionCount = localStorage.getItem('SUBMISSION_COUNT');
            let submissionStreak = localStorage.getItem('SUBMISSION_STREAK');
            this.submissionCount = submissionCount ? submissionCount : 0;
            this.submissionStreak = submissionStreak ? submissionStreak : 0;
        });
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
                            <p>Progression chart will come here</p>
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
                        <div class="previous-submissions-list">
                            ${this.previousSubmissions &&
                                this.previousSubmissions.map((sub, i) => {
                                    let previousSubmission = this.previousSubmissions[i + 1]; // +1 because we're going from latest
                                    let symptoms = this.getSymptomsForSubmission(sub);
                                    console.log(sub);
                                    return html`
                                        <div class="previous-submission">
                                            <div class="previous-submission--data-row">
                                                <p class="previous-submission--data-row__date">
                                                    ${dayjs(sub.timestamp).format('ddd DD.MM')}
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

    createRenderRoot() {
        return this;
    }
}

if (!customElements.get('fevermap-data-view')) {
    customElements.define('fevermap-data-view', FevermapDataView);
}
