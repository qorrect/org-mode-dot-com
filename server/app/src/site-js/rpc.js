class RPC {

    static async get(url, data, parseJson = true) {
        let sep = '?';
        if (url.indexOf('?') !== -1) sep = '&';
        const request = new DlRPC({url: url + sep + 'timestamp=' + Date.now(), data});
        return new Promise(((resolve) => request.call({
            callback: (x) => {
                if (parseJson) x.json = JSON.parse(x.text);
                resolve(x);
            }
        })));
    }
}

window.RPC = RPC;
