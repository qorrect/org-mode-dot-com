/* eslint-disable no-unused-vars,arrow-body-style */
const rp = require('request-promise');
const auth = 'Basic ' + new Buffer('q981hmn10d95t1t:wtmt7hgtatm6w0v').toString('base64');
const Dropbox = require('dropbox').Dropbox;
const BaseFileController = require('./BaseFileController.class');
const fetch = require('isomorphic-fetch');
const {Strings} = require('../constants');
const config = require('config');
const {execInParallel} = require('../utils/collectionUtils');
const logger = require('../utils/logUtil');
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;
let g_dropboxController = null;

class DropboxController extends BaseFileController {

    constructor(accessToken) {
        super(accessToken);
        this.ignoreDirectories = config.get('ignoreDirectories');
        this.dropbox = DropboxController.getDropbox(this.accessToken);
        this.redirect_uri = config.get('redirect_uri');
    }

    /**
     *
     * @param {String} accessToken - accessToken
     * @returns {DropboxController} - self
     */
    static set(accessToken) {
        g_dropboxController = null;
        g_dropboxController = new DropboxController(accessToken);
        return g_dropboxController;
    }

    /**
     *
     * @param {String} accessToken - accessToken
     * @returns {DropboxController} - self
     */
    static get(accessToken = '') {
        if (g_dropboxController)
            return g_dropboxController;
        else return DropboxController.set(accessToken);
    }

    async readFile(path) {

        const data = await this.dropbox.filesDownload({path});
        const blob = data.fileBinary;
        const file = new TextDecoder('utf-8').decode(blob);
        return file;

    }

    async lsDir(path = '', filter = '') {

        const res = await this.dropbox.filesListFolder({path});
        return res.entries.map(file => {
            return {name: file.name, path: file.path_display, type: file['.tag']};
        });
    }

    async lsDirRecursive(path = '/') {
        const children = await this._lsDirRecursive(path);
        return {children, path: '/', name: '/', type: 'folder'};

    }

    async _lsDirRecursive(path = '/') {

        logger.warn(`Starting lsDirRecursive with "${path}"`);

        const self = this;
        const entries = await this.lsDir(path);

        const children = await execInParallel(
            entries.filter(e => e.type === Strings.Types.FOLDER && !this.ignoreDirectories.find(d => e.path.split('/').find(split => split === d))),
            async (entry) => {
                entry.children = await self._lsDirRecursive(entry.path);
                return entry;
            });

        return entries;
    }

    static getDropbox(accessToken) {
        return new Dropbox({
            fetch,
            accessToken
        });
    }

    static async getAccessToken(code) {


        const options = {
            uri: 'https://api.dropbox.com/1/oauth2/token?code=' + code + '&grant_type=authorization_code&redirect_uri=' + this.redirect_uri,
            method: 'POST',
            headers: {
                'Authorization': auth
            },
            json: true
        };

        return rp(options);
    }
}

module.exports = DropboxController;
