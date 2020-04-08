import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import DBUtil, { QUEUED_ENTRIES, FEVER_ENTRIES } from '../util/db-util.js';
import Translator from '../util/translator.js';
import GoogleAnalyticsService from './google-analytics-service.js';

/*  Get API server address from environment variable stored in the webpack build
/* during build time */
const apiBaseUrl = process.env.API_URL || window.URLS.API_URL;

const apiSubmitUrl = `${apiBaseUrl}/api/v0/submit`;
const apiDataUrl = `${apiBaseUrl}/api/v0/stats`;

export default class DataEntryService {
  static async handleDataEntrySubmission(feverData, addToDbOnFail = true) {
    try {
      const response = await fetch(apiSubmitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feverData),
      });
      if (!response.ok) {
        return { success: false, reason: 'INVALID_DATA' };
      }
      const resJson = await response.json(); // Change to json on real one
      DataEntryService.handleAPIErrorMessages(resJson);
      return resJson;
    } catch (err) {
      if (addToDbOnFail) {
        const db = await DBUtil.getInstance();
        db.add(QUEUED_ENTRIES, feverData);
      }
      return { success: false, reason: 'NETWORK_STATUS_OFFLINE' };
    }
  }

  static handleAPIErrorMessages(resJson) {
    if (!resJson.success) {
      if (resJson.message.includes('Do not submit new temp')) {
        const time = resJson.message.split('Do not submit new temp before ').pop();
        dayjs.extend(utc);
        // eslint-disable-next-line no-param-reassign
        resJson.message = Translator.get('system_messages.error.do_not_submit_new_temp_until', {
          dateTime: dayjs
            .utc(time)
            .local()
            .format('YYYY-MM-DD : HH:mm'),
        });
        GoogleAnalyticsService.reportTooEarlySubmission();
      }
    }
  }

  static async getStats() {
    const response = await fetch(apiDataUrl).then(res => res.json());
    return response;
  }

  static async setEntriesToIndexedDb(submissionResponse) {
    const submissionHistory = submissionResponse.data.history;

    if (submissionResponse && submissionHistory != null) {
      const db = await DBUtil.getInstance();

      // Check entries returned as history from API, and see if there are values that don't match
      // the values in IDB. if yes, delete those values to make room for new ones.

      // Example is if you've prodded with the DB and changed the timestamp_modified for example.
      const allEntries = await db.getAll(FEVER_ENTRIES);
      const submissionHistoryTimeStamps = submissionHistory.map(entry => entry.timestamp);
      allEntries.map(async entry => {
        if (!submissionHistoryTimeStamps.includes(entry.timestamp)) {
          await db.delete(FEVER_ENTRIES, entry.timestamp);
        }
      });

      const submissionHistoryLength = submissionHistory.length - 1;
      submissionHistory.map(async (submission, i) => {
        const entryInDb = await db.get(FEVER_ENTRIES, submission.timestamp);
        if (!entryInDb) {
          await db.add(FEVER_ENTRIES, submission);
        }
        if (i >= submissionHistoryLength && typeof document !== 'undefined') {
          document.dispatchEvent(new CustomEvent('update-submission-list'));
        }
      });

      localStorage.setItem('SUBMISSION_COUNT', submissionHistoryLength + 1);
      localStorage.setItem(
        'SUBMISSION_STREAK',
        DataEntryService.determineStreak(submissionHistory),
      );
    }
  }

  static determineStreak(history) {
    const dates = history.map(entry => dayjs(entry.timestamp));
    const latest = dates.sort((a, b) => b.unix() - a.unix())[0];

    let streak = 1;
    let streakWasBroken = false;
    let dateToFind = latest;
    dayjs.extend(dayOfYear);

    while (!streakWasBroken) {
      dateToFind = dateToFind.subtract(1, 'day');
      const dayOfYearToFind = dateToFind.dayOfYear();
      const entriesOnDate = dates.find(date => date.dayOfYear() === dayOfYearToFind);
      if (entriesOnDate > 0) {
        streak += 1;
      } else {
        streakWasBroken = true;
      }
    }
    return streak;
  }
}
