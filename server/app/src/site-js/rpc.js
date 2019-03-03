class RPC {

    static async get(url, data) {
        let sep = '?';
        if ( url.indexOf('?') !== -1 ) sep = '&';
        const request = new DlRPC({url: url + sep + 'timestamp=' + Date.now(), data});
        return new Promise(((resolve) => request.call({
            callback: (x) => {
                x.res = JSON.parse(x.text);
                resolve(x);
            }
        })));
    }
}

window.RPC = RPC;
