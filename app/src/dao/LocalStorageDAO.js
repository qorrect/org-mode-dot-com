class LocalStorageDAO extends BaseDAO {
    /**
     * @override
     * @param key
     * @returns {Promise<string>}
     */
    async get(key) {
        const res = localStorage.getItem(key);
        return Promise.resolve(res);

    }

    /**
     * @override
     * @param key
     * @param val
     * @returns {Promise<void>}
     */
    async put(key, val) {
        const res = localStorage.setItem(key, val);
        return Promise.resolve(res);
    }

    /**
     * @override
     * @param key
     * @returns {Promise<void>}
     */
    async del(key) {
        const res = localStorage.removeItem(key);
        return Promise.resolve(res);

    }
}


