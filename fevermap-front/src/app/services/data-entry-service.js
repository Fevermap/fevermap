import DBUtil, { QUEUED_ENTRIES } from '../util/db-util';

export default class DataEntryService {
    static async handleDataEntrySubmission(feverData, addToDbOnFail = true) {
        try {
            let response = await fetch('localhost'); // The real post comes here
            if (!response.ok) {
                return { success: false, reason: 'INVALID_DATA' };
            }
            const resJson = await response.text(); // Change to json on real one
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
}
