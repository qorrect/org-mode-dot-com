class DropboxFileSystem extends BaseFileSystem {

    constructor() {
        super();
        this.cache = {};
    }

    async lsDir(path) {
        const url = `../api/files?path=${encodeURI(path)}`;
        const res = await RPC.get(url);

        if (url in this.cache) {
            return this.cache[url];
        } else {
            const result = res.json.map(entry => {
                if (entry.type === Strings.Types.FOLDER) {
                    return entry.name + '/';
                } else return entry.name;
            });
            this.cache[url] = result;
            return result;
        }
    }

    async readFile(path) {
        const url = `../api/file/${encodeURIComponent(path)}`;
        const res = await RPC.get(url, null, false);
        return res.text.replace(/\r\n/g,'\n');
    }

    async refresh() {
        const res = await RPC.get('../api/files?recursive=true');
        return res.json;
    }
}
