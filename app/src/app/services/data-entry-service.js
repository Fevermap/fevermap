/* global BigInt */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import DBUtil, { QUEUED_ENTRIES, FEVER_ENTRIES } from '../util/db-util.js';
import Translator from '../util/translator.js';
import GoogleAnalyticsService from './google-analytics-service.js';

/*  Get API server address from environment variable stored in the webpack build
/* during build time */
// This Service is used by the Service worker also, so we have to check for window object existence
const apiBaseUrl = () => {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  if (typeof window !== 'undefined' && window.URLS.API_URL) {
    return window.URLS.API_URL;
  }
  return '';
};

const apiBase = `${apiBaseUrl()}/api/v0`;

const apiSubmitUrl = `${apiBase}/submit`;
const apiStatsUrl = `${apiBase}/stats`;
const apiLocationUrl = `${apiBase}/location`;

export default class DataEntryService {
  static async handleDataEntrySubmission(feverData, addToDbOnFail = true) {
    try {
      // Set or generate device ID
      this.setDeviceId(feverData);

      const response = await this.callWithRetry(
        async () =>
          fetch(apiSubmitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feverData),
          }),
        r => {
          if (!r.success && r.status === 409) {
            // The newly generated device id is already taken, so we regenerate and retry
            this.resetDeviceId();
            this.setDeviceId(feverData);
            return true;
          }
          return false;
        },
      );
      if (!response.ok) {
        if (response.status === 409) {
          if (addToDbOnFail) {
            this.addToDb(feverData);
          }
          this.resetDeviceId();
          return { success: false, reason: 'REGEN_DEVICE_ID' };
        }
        return { success: false, reason: 'INVALID_DATA' };
      }
      const resJson = await response.json(); // Change to json on real one
      DataEntryService.handleAPIErrorMessages(resJson);
      return resJson;
    } catch (err) {
      if (addToDbOnFail) {
        this.addToDb(feverData);
      }
      return { success: false, reason: 'NETWORK_STATUS_OFFLINE' };
    }
  }

  static async addToDb(feverData) {
    const db = await DBUtil.getInstance();
    db.add(QUEUED_ENTRIES, feverData);
  }

  static handleAPIErrorMessages(resJson) {
    if (!resJson.success) {
      if (resJson.message.includes('Do not submit new temp')) {
        const time = resJson.message.split('Do not submit new temp before ').pop();
        dayjs.extend(utc);
        // eslint-disable-next-line no-param-reassign
        resJson.message = Translator.get('system_messages.error.do_not_submit_new_temp_until', {
          dateTime: dayjs.utc(time).local().format('YYYY-MM-DD : HH:mm'),
        });
        GoogleAnalyticsService.reportTooEarlySubmission();
      }
    }
  }

  static async getStats() {
    const response = await fetch(apiStatsUrl).then(res => res.json());
    return response;
  }

  static async getLocationBasedStats(country) {
    if (!country) {
      return fetch(apiLocationUrl).then(res => res.json());
    }
    return fetch(`${apiLocationUrl}/${country}`).then(res => res.json());
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

          if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('submission-stats-update'));
          }
        }
      });
    }
  }

  static determineStreak(history) {
    const dates = history.map(entry => dayjs(entry.timestamp));
    const latest = dates.sort((a, b) => b.unix() - a.unix())[0];

    let streak = 1;
    let streakWasBroken = false;
    let dateToFind = latest;
    dayjs.extend(dayOfYear);

    if (!dateToFind) {
      return 0;
    }
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

  static resetDeviceId() {
    localStorage.removeItem('DEVICE_ID');
  }

  //
  static setDeviceId(data) {
    const feverData = data;
    let deviceId = localStorage.getItem('DEVICE_ID');
    if (!deviceId) {
      deviceId = this.createDeviceId();
      feverData.new_device_id = true;
      localStorage.setItem('DEVICE_ID', deviceId);
    } else {
      feverData.new_device_id = false;
    }
    feverData.device_id = deviceId;
  }

  /**
   * Try and retry an action with exponential backoff
   *
   * @param f {function} Action function
   * @param shouldRetry {function} Evaluate whether to retry or not
   * @param retryCount Max retry count
   * @returns {Promise<*>}
   */
  static async callWithRetry(f, shouldRetry, retryCount = 10) {
    let retries = 0;
    let response = await f();
    while (retries < retryCount && shouldRetry(response)) {
      retries += 1;
      // Exponential backoff up to 30 seconds, with added random jitter
      // eslint-disable-next-line no-await-in-loop
      await this.wait(Math.random() * 100 + 2.8 ** retries);
      // eslint-disable-next-line no-await-in-loop
      response = await f();
    }
    return response;
  }

  static async wait(millis) {
    return new Promise(resolve => {
      setTimeout(resolve, Math.ceil(millis));
    });
  }

  /**
   * Generates random numerical device id, which fits in a BIGINT (64-bit), signed or unsigned
   * @returns {string}
   */
  static createDeviceId() {
    const isModern =
      window.crypto &&
      window.crypto.getRandomValues &&
      window.Uint32Array &&
      typeof BigInt !== 'undefined';
    if (!isModern) {
      return this.createLegacyDeviceId();
    }
    // Create a 63-bit integer
    const array = new Uint32Array(2);
    window.crypto.getRandomValues(array);
    // eslint-disable-next-line no-bitwise
    const msb = BigInt(array[0] & 0x7fffffff) << BigInt(32); // use 31 bits
    return (msb + BigInt(array[1])).toString(10);
  }

  /**
   * Legacy platforms: create a hand-wavy large "integer" of max 18 characters
   * @returns {string}
   */
  static createLegacyDeviceId() {
    const time = Date.now();
    const randomInt = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    return `${time}${randomInt}`.substr(0, 18);
  }
}
