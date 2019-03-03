/* eslint-disable no-unused-vars */
class BaseFileController {
    constructor(accessToken) {
        this.accessToken = accessToken;
    }

    async lsDir(path = '', filter = '') {

        // Returns
        // { name: 'file_name.txt', path: 'src/controllers',type: 'file'
    }

    async lsDirRecursive(path = '/') {
        // Returns
        // { name: '/' ,path: '/' , type: 'folder', children: [ lsDirResponse ] }
    }
}

module.exports = BaseFileController;
