const dbName = 'FeverMapDB';
const versionNum = 3;

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
    return new Promise(resolve => resolve(DBUtil._instance));
  }

  constructor(resolve, reject) {
    this.db = null;

    const request = indexedDB.open(dbName, versionNum);
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
    if (versionNum === 3) {
      if (this.db.objectStoreNames.contains(FEVER_ENTRIES)) {
        this.db.deleteObjectStore(FEVER_ENTRIES);
      }
      if (this.db.objectStoreNames.contains(QUEUED_ENTRIES)) {
        this.db.deleteObjectStore(QUEUED_ENTRIES);
      }
    }
    objectStores.forEach(os => {
      if (!this.db.objectStoreNames.contains(os.name)) {
        this.db.createObjectStore(os.name, os.options);
      }
    });
    resolve(this);
  }

  // eslint-disable-next-line class-methods-use-this
  makeSureDbIsReady() {
    return new Promise(resolve => {
      (function waitForDb() {
        if (DBUtil.initializedSuccessfully && DBUtil._instance && DBUtil._instance.db != null)
          resolve();
        setTimeout(waitForDb, 100);
      })();
    });
  }

  async get(objectStore, identifier) {
    await this.makeSureDbIsReady();
    return new Promise(resolve => {
      const getter = this.db.transaction(objectStore).objectStore(objectStore).get(identifier);
      getter.onsuccess = event => resolve(event.target.result);
    });
  }

  async getAll(objectStore) {
    await this.makeSureDbIsReady();
    return new Promise(resolve => {
      const getter = this.db.transaction(objectStore).objectStore(objectStore).getAll();
      getter.onsuccess = event => resolve(event.target.result);
      getter.onerror = e => {
        throw ('Had trouble trying to access indexedDB', e);
      };
    });
  }

  async add(targetDataStore, data) {
    await this.makeSureDbIsReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([targetDataStore], 'readwrite');

      transaction.oncomplete = e => {
        resolve(e);
      };

      transaction.onerror = e => {
        reject(e);
      };

      const objectStore = transaction.objectStore(targetDataStore);

      objectStore.add(data);
    });
  }

  async delete(targetDataStore, identifier) {
    await this.makeSureDbIsReady();
    return new Promise((resolve, reject) => {
      const request = this.db
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
