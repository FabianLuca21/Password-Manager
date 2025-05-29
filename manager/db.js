class Database {
    constructor() {
        this.dbName = 'PasswordManagerDB';
        this.dbVersion = 1;
        this.db = null;
        this.apiUrl = 'http://localhost:3000/api';
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'email' });
                    userStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('passwords')) {
                    const passwordStore = db.createObjectStore('passwords', { keyPath: 'id', autoIncrement: true });
                    passwordStore.createIndex('userId', 'userId', { unique: false });
                    passwordStore.createIndex('website', 'website', { unique: false });
                }
            };
        });
    }

    async addPassword(password) {
        const response = await fetch(`${this.apiUrl}/passwords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(password)
        });
        return response.json();
    }

    async getPasswords(userId) {
        const response = await fetch(`${this.apiUrl}/passwords/${userId}`);
        return response.json();
    }

    async deletePassword(id) {
        const response = await fetch(`${this.apiUrl}/passwords/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    async updatePassword(password) {
        const response = await fetch(`${this.apiUrl}/passwords/${password.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(password)
        });
        return response.json();
    }

    async getAllPasswords() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['passwords'], 'readonly');
            const store = transaction.objectStore('passwords');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['passwords'], 'readwrite');
            const store = transaction.objectStore('passwords');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new Database(); 