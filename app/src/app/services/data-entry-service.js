import DBUtil, { QUEUED_ENTRIES } from '../util/db-util';

/* @TODO: The apiBaseUrl should be derived from environment variable $URL */
const apiBaseUrl = 'https://dev.fevermap.net';

const apiSubmitUrl = apiBaseUrl + '/api/v0/submit';
const apiDataUrl = apiBaseUrl + '/api/v0/stats';

export default class DataEntryService {
    static async handleDataEntrySubmission(feverData, addToDbOnFail = true) {
        try {
            let response = await fetch(apiSubmitUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feverData),
            });
            if (!response.ok) {
                return { success: false, reason: 'INVALID_DATA' };
            }
            const resJson = await response.json(); // Change to json on real one
            return { success: true, data: resJson };
        } catch (err) {
            console.error('Error: ', err);
            if (addToDbOnFail) {
                let db = await DBUtil.getInstance();
                db.add(QUEUED_ENTRIES, feverData);
            }
            return { success: false, reason: 'NETWORK_STATUS_OFFLINE' };
        }
    }

    static async getStats() {
        let response = await fetch(apiDataUrl).then(res => res.json());
        return response;
    }
}
