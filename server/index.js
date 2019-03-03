const express = require('express');
const app = express();
const session = require('express-session');
const DropboxController = require('./src/controllers/DropboxController.class');
const _path = require('path');
const stringUtils = require('./src/utils/stringUtils')
const SESSION_OPTIONS = {
    secret: 'hey_its_me_org_mode',
    cookie: {}
};

if (app.get('env') === 'production') {
    app.set('trust proxy', 1);// trust first proxy
    SESSION_OPTIONS.cookie.secure = true; // serve secure cookies
}
const logger = require('./src/utils/logUtil');
app.use(session(SESSION_OPTIONS));
app.use('/app', express.static(_path.join(__dirname, 'app')));


process.on('unhandledRejection', (err, p) => {
    logger.error(err.stack);
    logger.error(`Unhandled REJECTION at: ${err.toString()} - Promise ( ${JSON.stringify(p)} )`);
    logger.error(`${new Error().stack}`);
});
process.on('uncaughtException', err => {
    logger.error(err.toString());
    logger.error(err.stack);
    logger.error('Unhandled EXCEPTION');

});

app.get('/api/file/:path', async (req, res) => {
    const path = req.params.path;
    let content = '';
    try {
        content = await DropboxController.get(req.session.accessToken).readFile(stringUtils.ensureStartsWithSlash(path));
        console.log('content=');
        console.log(content);
    } catch (e) {
        logger.error(e);
        content = e.toString();
    }
    res.send(content);
});
app.get('/api/files', async (req, res) => {
    let files = '';
    try {
        const path = req.query.path || '';
        const filter = req.query.filter || '';
        const recursive = req.query.recursive || false;
        if (recursive) {
            console.log('recursive');
            files = await DropboxController.get(req.session.accessToken).lsDirRecursive(path);

        } else {
            files = await DropboxController.get(req.session.accessToken).lsDir(path, filter);
        }
    } catch (e) {
        logger.error(e);
        files = e;
    }
    res.json(files);
});

app.get('/authed', async (req, res) => {
    const code = req.query.code;

    const result = await DropboxController.getAccessToken(code);
    const accessToken = result['access_token'];
    req.session.accessToken = accessToken;
    DropboxController.set(accessToken);
    res.redirect('app/index.html');

});

// eslint-disable-next-line
const server = app.listen(8081, () => {
    const host = 'localhost';
    const port = 8081;
    logger.info(`Org-mode is listening on ${host} ${port}`);
});
