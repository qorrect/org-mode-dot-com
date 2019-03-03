class DropboxFileSystem extends BaseFileSystem {

    async lsDir(path) {
        const res = await RPC.get(`../api/files?path=${encodeURI(path)}`);
        return res.json.map(entry => {
            if (entry.type === Strings.Types.FOLDER) {
                return entry.name + '/';
            } else return entry.name;
        });
    }

    async readFile(path) {
        const url = `../api/file/${encodeURIComponent(path)}`;
        const res = await RPC.get(url, null, false);
        return res.text;
    }

    async refresh() {
        const res = RPC.get('../api/files?recursive=true');
        return res.json;
    }
}
