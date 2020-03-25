const dbName = 'FeverMapDB';
const versionNum = 2;

export const FEVER_ENTRIES = 'feverEntries';
export const QUEUED_ENTRIES = 'queuedEntries';

const objectStores = [
    {
        name: FEVER_ENTRIES,
        options: { keyPath: 'timestamp', autoIncrement: true },
    },
    {
        name: QUEUED_ENTRIES,
        options: { keyPath: 'id', autoIncrement: true },
    },
];

export default class DBUtil {
    static getInstance() {
        if (DBUtil._instance == null) {
            DBUtil.initializedSuccessfully = false;
            return new Promise((resolve, reject) => {
                DBUtil._instance = new DBUtil(resolve, reject);
            });
        }
        return new Promise(resolve => {
            return resolve(DBUtil._instance);
        });
    }

    constructor(resolve, reject) {
        this.db = null;

        let request = indexedDB.open(dbName);
        request.onerror = () => {
            reject(request.error);
        };
        request.onsuccess = e => this._handleInitSuccess(e, resolve);
        request.onupgradeneeded = e => this._handleUpgradeNeed(e, resolve);
    }

    _handleInitSuccess(e, resolve) {
        this.db = e.target.result;
        DBUtil.initializedSuccessfully = true;
        resolve(this);
    }

    _handleUpgradeNeed(e, resolve) {
        this.db = e.target.result;
        objectStores.map(os => {
            if (!this.db.objectStoreNames.contains(os.name)) {
                this.db.createObjectStore(os.name, os.options);
            }
        });
        resolve(this);
    }

    makeSureDbIsReady() {
        return new Promise(resolve => {
            (function waitForDb() {
                if (DBUtil.initializedSuccessfully && DBUtil._instance && DBUtil._instance.db != null) return resolve();
                setTimeout(waitForDb, 100);
            })();
        });
    }

    async get(objectStore, identifier) {
        await this.makeSureDbIsReady();
        return new Promise(resolve => {
            let getter = this.db
                .transaction(objectStore)
                .objectStore(objectStore)
                .get(identifier);
            getter.onsuccess = event => {
                return resolve(event.target.result);
            };
        });
    }

    async getAll(objectStore) {
        await this.makeSureDbIsReady();
        return new Promise(resolve => {
            let getter = this.db
                .transaction(objectStore)
                .objectStore(objectStore)
                .getAll();
            getter.onsuccess = event => {
                return resolve(event.target.result);
            };
            getter.onerror = e => {
                console.error('Had trouble trying to access indexedDB', e);
            };
        });
    }

    async add(targetDataStore, data) {
        await this.makeSureDbIsReady();
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction([targetDataStore], 'readwrite');

            transaction.oncomplete = e => {
                resolve(e);
            };

            transaction.onerror = e => {
                reject(e);
            };

            let objectStore = transaction.objectStore(targetDataStore);

            let request = objectStore.add(data);
        });
    }

    async delete(targetDataStore, identifier) {
        await this.makeSureDbIsReady();
        return new Promise((resolve, reject) => {
            let request = this.db
                .transaction([targetDataStore], 'readwrite')
                .objectStore(targetDataStore)
                .delete(identifier);
            request.oncomplete = e => {
                resolve(e);
            };
            request.onerror = e => {
                reject(e);
            };
        });
    }
}
