class LocalStorageDAO extends BaseDAO {
    /**
     * @override
     * @param key
     * @returns {Promise<string>}
     */
    async get(key, def = null) {
        const res = localStorage.getItem(key);
        return Promise.resolve(JSON.parse(res) || def);

    }

    /**
     * @override
     * @param key
     * @param val
     * @returns {Promise<void>}
     */
    async put(key, val) {
        const res = localStorage.setItem(key, JSON.stringify(val));
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


