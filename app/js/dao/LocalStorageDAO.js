class LocalStorageDAO extends BaseDAO {
    async get(key) {
        const res = localStorage.getItem(key);
        return Promise.resolve(res);

    }

    async put(key, val) {
        const res = localStorage.setItem(key, val);
        return Promise.resolve(res);
    }

    async del(key) {
        const res = localStorage.removeItem(key);
        return Promise.resolve(res);

    }
}


