import DBUtil, { QUEUED_ENTRIES } from '../util/db-util';
import Translator from '../util/translator';
import dayjs from 'dayjs';

const apiBaseUrl = process.env.URL;

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
            DataEntryService.handleAPIErrorMessages(resJson);
            return resJson;
        } catch (err) {
            console.error('Error: ', err);
            if (addToDbOnFail) {
                let db = await DBUtil.getInstance();
                db.add(QUEUED_ENTRIES, feverData);
            }
            return { success: false, reason: 'NETWORK_STATUS_OFFLINE' };
        }
    }

    static handleAPIErrorMessages(resJson) {
        if (!resJson.success) {
            if (resJson.message.includes('Do not submit new temp')) {
                let newMessage = Translator.get('system_messages.error.do_not_submit_new_temp_until');
                let time = resJson.message.split('Do not submit new temp before ').pop();
                newMessage += ` ${dayjs(time).format('YYYY-MM-DD : HH:mm')}`;
                resJson.message = newMessage;
            }
        }
    }

    static async getStats() {
        let response = await fetch(apiDataUrl).then(res => res.json());
        return response;
    }
}
