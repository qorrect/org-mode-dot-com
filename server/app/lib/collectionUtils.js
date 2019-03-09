/* eslint-disable no-unused-vars */

// import * as async from "./async.min";

function range(start, end) {
    return [...Array(1 + end - start).keys()].map(v => start + v);
}

function emptyFunc() {
}

async function execInSeries(list, func) {
    return new Promise((resolve, reject) => {
        const results = [];
        async.eachSeries(list, async (id) => {
                const res = await func(id);
                results.push(res);
            },
            err => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                } else return resolve(results);
            });
    });
}


async function execInParallel(list, func) {
    return new Promise((resolve, reject) => {
        const results = [];
        async.each(list, async (id) => {
                const res = await func(id);
                results.push(res);
            },
            err => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                } else return resolve(results);

            });
    });
}

async function mapInParallel(list, func) {
    if (Array.isArray(list) && list.length) {
        return new Promise((resolve, reject) => {
            async.map(list, async (id, onFinished) => func(id, onFinished),
                (err, results) => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    }
                    resolve(results);
                });
        });
    } else return Promise.resolve({});
}

function ensureObject(o, defaults = {}) {
    if (o && !_.isEmpty(o)) return o;
    else return defaults;
}

function ensureList(l) {
    if (l && Array.isArray(l)) return l;
    else return [];
}

function ensureUnique(l) {
    if (l && Array.isArray(l)) {
        return Array.from(new Set(l));
    } else return [];
}

function compact(l) {
    return _.compact(l.map(x => x && !_.isEmpty(x) ? x : false));
}

function prune(obj, keys = ['action', 'called_by', 'display', 'user_id', 'ssh_needs_keys_generated', 'ssh_key_contents', 'request_data']) {
    const ret = clone(obj);
    keys.forEach(key => {
        delete ret[key];
    });
    return ret;
}

