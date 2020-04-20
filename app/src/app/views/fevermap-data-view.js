/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Translator from '../util/translator.js';
import DBUtil, { FEVER_ENTRIES, QUEUED_ENTRIES } from '../util/db-util.js';
import GeolocatorService from '../services/geolocator-service.js';
import FeverDataUtil from '../util/fever-data-util.js';
import '../components/fever-chart.js';
import GoogleAnalyticsService from '../services/google-analytics-service.js';
import ScrollService from '../services/scroll-service.js';
import DataEntryService from '../services/data-entry-service.js';
import SnackBar from '../components/snackbar.js';
import NotificationService from '../services/notification-service.js';
import BirthYearRangeSelector from '../components/birth-year-range-selector.js';

class FevermapDataView extends LitElement {
  static get properties() {
    return {
      lastSubmissionTime: { type: String },
      submissionCount: { type: Number },
      submissionStreak: { type: Number },
      previousSubmissions: { type: Array },
      geoCodingInfo: { type: Object },
      firstTimeSubmitting: { type: Boolean },
      lastSubmissionIsTooCloseToNow: { type: Boolean },
      nextAllowedSubmitTime: { type: String },

      setGender: { type: String },
      setBirthYear: { type: String },
      setCovidDiagnosis: { type: Boolean },
      showEditFields: { type: Boolean },

      queuedEntries: { type: Array },
      hasSubscribedToTopic: { type: Boolean },
    };
  }

  constructor() {
    super();

    const submissionCount = localStorage.getItem('SUBMISSION_COUNT');
    const submissionStreak = localStorage.getItem('SUBMISSION_STREAK');
    this.submissionCount = submissionCount || 0;
    this.submissionStreak = submissionStreak || 0;
    dayjs.extend(utc);

    this.checkLastSubmissionTime();

    const gender = localStorage.getItem('GENDER');
    let birthYear = localStorage.getItem('BIRTH_YEAR');
    birthYear = this.handleOldBirthYear(birthYear);
    const covidDiagnosis = localStorage.getItem('COVID_DIAGNOSIS');
    this.setGender = gender || null;
    this.setBirthYear = birthYear || '';
    this.setCovidDiagnosis = covidDiagnosis === 'true';
    this.previousSubmissions = null;
    this.showEditFields = false;

    this.firstTimeSubmitting = this.setGender == null || this.setBirthYear == null;

    this.getPreviousSubmissionsFromIndexedDb();
    this.hasSubscribedToTopic = localStorage.getItem('NOTIFICATION_TOPIC');
  }

  /**
   * Since we've changed from exact year to year range, some users have the old format.
   * This wil re-format the user's age to match the new system.
   * @param birthYear
   */
  handleOldBirthYear(birthYear) {
    if (birthYear % 10 !== 0) {
      this.handleAgeChange(Math.floor(birthYear / 10) * 10);
      return this.setBirthYear;
    }
    return birthYear;
  }

  firstUpdated() {
    this.getGeoLocationInfo();
    document.addEventListener('update-submission-list', () => {
      this.getPreviousSubmissionsFromIndexedDb();

      this.setGender = localStorage.getItem('GENDER');
      this.setBirthYear = localStorage.getItem('BIRTH_YEAR');
      this.setCovidDiagnosis = localStorage.getItem('COVID_DIAGNOSIS') === 'true';

      this.checkLastSubmissionTime();
    });

    document.addEventListener('update-queued-count', () => {
      this.getQueuedEntriesFromIndexedDb();
    });
    document.addEventListener('update-notification-subscription-status', () => {
      this.hasSubscribedToTopic = localStorage.getItem('NOTIFICATION_TOPIC');
    });

    if (this.firstTimeSubmitting || this.isFromNotification()) {
      this.showEntryDialog();
      window.history.pushState({}, '', `/`);
    }
    this.getQueuedEntriesFromIndexedDb();
    GoogleAnalyticsService.reportNavigationAction('Your Data View');
    this.getSubmissionStats();

    document.addEventListener('submission-stats-update', () => {
      this.getSubmissionStats();
    });

    // Update the feed on focus to get the latest info after background submit etc
    window.addEventListener('focus', () => {
      this.getSubmissionStats();
      document.dispatchEvent(new CustomEvent('update-submission-list'));
    });
  }

  /**
   * Set asynchronously load language pack from dayjs locales and
   * set it for weekday translations in stats
   * @returns {Promise<void>}
   */
  async setDayJsLanguage() {
    const langKey = Translator.getLang().key || 'en';
    if (langKey === 'en') {
      // Dayjs defaults to english
      return;
    }
    try {
      await import(`dayjs/locale/${langKey}.js`);
      dayjs.locale(langKey);
    } catch (err) {
      dayjs.locale('en');
    }
  }

  async getSubmissionStats() {
    const db = await DBUtil.getInstance();
    const submissionHistory = await db.getAll(FEVER_ENTRIES);
    const submissionCount = submissionHistory.length;
    const submissionStreak = DataEntryService.determineStreak(submissionHistory);

    localStorage.setItem('SUBMISSION_COUNT', submissionCount);
    localStorage.setItem('SUBMISSION_STREAK', submissionStreak);

    this.submissionCount = submissionCount || 0;
    this.submissionStreak = submissionStreak || 0;
  }

  checkLastSubmissionTime() {
    const lastEntryTime = localStorage.getItem('LAST_ENTRY_SUBMISSION_TIME');
    if (lastEntryTime && lastEntryTime !== 'undefined') {
      this.lastSubmissionTime = dayjs(Number(lastEntryTime)).format('DD-MM-YYYY : HH:mm');
      this.lastSubmissionIsTooCloseToNow = dayjs(Number(lastEntryTime))
        .local()
        .add(1, 'hour')
        .isAfter(dayjs(Date.now()));
      this.nextAllowedSubmitTime = dayjs(Number(lastEntryTime))
        .add(1, 'hour')
        .local()
        .format('DD-MM-YYYY : HH:mm');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  isFromNotification() {
    return /fromNotification=true/.test(window.location.search.substring(1));
  }

  async getGeoLocationInfo(forceUpdate) {
    if (!this.geoCodingInfo || forceUpdate) {
      navigator.geolocation.getCurrentPosition(async success => {
        this.geoCodingInfo = await GeolocatorService.getGeoCodingInfo(
          success.coords.latitude,
          success.coords.longitude,
        );
        delete this.geoCodingInfo.success;
      });
    }
  }

  async getPreviousSubmissionsFromIndexedDb() {
    await this.setDayJsLanguage();
    const db = await DBUtil.getInstance();
    const previousSubmissions = await db.getAll(FEVER_ENTRIES);
    if (previousSubmissions && previousSubmissions.length > 0) {
      this.previousSubmissions = previousSubmissions.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
    } else {
      this.previousSubmissions = [];
    }
  }

  // eslint-disable-next-line class-methods-use-this
  showEntryDialog() {
    const dataEntryDialog = document.createElement('fevermap-data-entry');
    document.querySelector('fevermap-root').appendChild(dataEntryDialog);
    setTimeout(() => {
      dataEntryDialog
        .querySelector('.view-wrapper')
        .classList.remove('fevermap-entry-dialog--hidden');
    });
  }

  // For use when we enable offline
  async getQueuedEntriesFromIndexedDb() {
    const db = await DBUtil.getInstance();
    const queuedSubmissions = await db.getAll(QUEUED_ENTRIES);
    if (queuedSubmissions && queuedSubmissions.length > 0) {
      this.queuedEntries = queuedSubmissions;
    } else {
      this.queuedEntries = null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
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
    const age = dayjs(new Date()).year() - this.setBirthYear;
    return `${age - 10}-${age}`;
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

  async syncQueuedEntries() {
    const db = await DBUtil.getInstance();
    let successfulSyncCount = 0;
    await this.queuedEntries.map(async (entry, i) => {
      const { id } = entry;
      // delete entry.id;
      const submissionResponse = await DataEntryService.handleDataEntrySubmission(entry, false);
      if (submissionResponse.success) {
        db.delete(QUEUED_ENTRIES, id);
        DataEntryService.setEntriesToIndexedDb(submissionResponse);
        successfulSyncCount += 1;
      } else {
        SnackBar.success(Translator.get('system_messages.success.entry_send_failed_queued'));
      }
      if (i === this.queuedEntries.length - 1) {
        if (successfulSyncCount > 0) {
          this.getQueuedEntriesFromIndexedDb();
          this.getPreviousSubmissionsFromIndexedDb();
          SnackBar.success(Translator.get('system_messages.success.sync_finished'));
        }
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  showSubmissionTooCloseSnackbar() {
    SnackBar.success(
      Translator.get('system_messages.error.do_not_submit_new_temp_until', {
        dateTime: this.nextAllowedSubmitTime,
      }),
    );
  }

  render() {
    return html`
      <div class="container view-wrapper fevermap-entry-view">
        <div class="fevermap-data-view-content">
          <div class="entry-history-title-area">
            <h2>${Translator.get('history.title')}</h2>
            <material-button
              @button-clicked="${this.lastSubmissionIsTooCloseToNow
                ? this.showSubmissionTooCloseSnackbar
                : this.showEntryDialog}"
              class="add-new-entry-button${this.lastSubmissionIsTooCloseToNow
                ? ' add-new-entry-button--disabled'
                : ''}"
              icon="add_circle"
              label="${Translator.get('history.add_entry')}"
            ></material-button>
          </div>
          <div class="entry-info-view-wrapper">
            <div class="progression-chart">
              <fever-chart
                .data="${this.previousSubmissions}"
                chartId="fever-history-chart"
                .geoCodingInfo="${this.geoCodingInfo}"
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
            ${this.queuedEntries && this.queuedEntries.length > 0
              ? html`
                  <div class="queued-entries">
                    <p>${Translator.get('entry.queued_entries')}</p>
                    <material-button
                      label="${Translator.get('entry.send_now')}"
                      icon="sync"
                      @click="${() => this.syncQueuedEntries()}"
                    ></material-button>
                  </div>
                `
              : ''}
            ${this.createPersistentDataFields()}
            <div class="previous-submissions-list">
              ${this.previousSubmissions &&
              this.previousSubmissions.map((sub, i) => {
                const previousSubmission = this.previousSubmissions[i + 1]; // +1 because we're going from latest
                const symptoms = this.getSymptomsForSubmission(sub);
                return html`
                  <div class="previous-submission">
                    <div class="previous-submission--data-row">
                      <p class="previous-submission--data-row__date">
                        ${dayjs.utc(sub.timestamp).local().format('ddd DD.MM HH:mm')}
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
                        ${this.getFeverAmountForSubmission(sub)}
                      </p>
                    </div>
                    <div class="previous-submission--symptom-row">
                      <div class="previous-submission--symptom-row__symptoms">
                        ${symptoms.map(
                          (symp, j) => html`
                            ${symp.hasSymptom
                              ? html`
                                  <p>
                                    ${symp.translation}${j < symptoms.length - 1 ? ', ' : ''}
                                  </p>
                                `
                              : ''}
                          `,
                        )}
                      </div>
                    </div>
                  </div>
                `;
              })}
            </div>
            ${this.getNotificationSubscriptionButton()}
          </div>
        </div>
      </div>
    `;
  }

  getNotificationSubscriptionButton() {
    if (!NotificationService.isMessagingSupported()) {
      return null;
    }
    if (this.hasSubscribedToTopic) {
      return html`
        <div class="unsubscribe-from-notifications">
          <material-button
            label="${Translator.get('notification.unsubscribe_from_notifications')}"
            icon="unsubscribe"
            @click="${NotificationService.unsubscribeFromDailyReminders}"
          ></material-button>
        </div>
      `;
    }
    return html`
      <div class="subscribe-to-notifications">
        <material-button
          label="${Translator.get('notification.subscribe_to_notifications')}"
          icon="email"
          @click="${NotificationService.requestNotificationPermissions}"
        ></material-button>
      </div>
    `;
  }

  getGenderTranslated() {
    return this.setGender === 'M'
      ? Translator.get('entry.questions.male').toLowerCase()
      : Translator.get('entry.questions.female').toLowerCase();
  }

  getCovidStatusTranslated() {
    return this.setCovidDiagnosis
      ? Translator.get('a_covid_diagnosis')
      : Translator.get('no_covid_diagnosis');
  }

  getFeverAmountForSubmission(sub) {
    if (sub.fever_status || sub.fever_temp) {
      return html`
        ${sub.fever_temp
          ? `${FeverDataUtil.getFeverWithUnit(false, sub.fever_temp, this.geoCodingInfo)}`
          : '-'}
      `;
    }
    return html` <material-icon class="green-text" icon="done"></material-icon> `;
  }

  getSeekForHelpText() {
    const locationCountry = localStorage.getItem('LOCATION_COUNTRY');
    if (!locationCountry) {
      return html``;
    }
    return html`
      ${Translator.get('entry.questions.location_seek_for_help_text')}
      <a href="${GeolocatorService.getCountrySeekTreatmentUrl(locationCountry)}" target="_blank">
        ${Translator.get('entry.questions.location_seek_for_help_link_text')}</a
      >
    `;
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
          })}. <br />
          ${this.getSeekForHelpText()}
        </p>
        <material-icon
          tabindex="0"
          icon="edit"
          @click="${() => {
            this.showEditFields = !this.showEditFields;
          }}"
        ></material-icon>
      </div>
      <div
        class="persistent-info-editing-fields ${this.showEditFields
          ? ''
          : ' persistent-info-editing-fields--hidden'}"
      >
        <div class="persistent-info-editing-fields--age-input">
          <p>${Translator.get('entry.questions.birth_year')}</p>
          <div class="birth-year-range-selectors">
            ${BirthYearRangeSelector.getBirthYearRanges().map(
              range =>
                html`
                  <birth-year-range-selector
                    @birth-year-selected="${e => this.handleAgeChange(e.detail.birthYear)}"
                    label=${range.name}
                    value=${range.value}
                    ?selected="${this.setBirthYear === range.value}"
                  ></birth-year-range-selector>
                `,
            )}
          </div>
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
            <label for="checkbox-1"
              >${Translator.get('entry.questions.positive_covid_diagnosis')}</label
            >
          </div>
        </div>
        <div class="persistent-info-editing-fields--submit-button">
          <material-button
            @click="${() => {
              this.showEditFields = false;
              ScrollService.scrollToTop();
            }}"
            icon="save"
            label="${Translator.get('entry.save')}"
          ></material-button>
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
