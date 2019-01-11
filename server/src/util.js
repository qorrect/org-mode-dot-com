const rp = require('request-promise');
const auth = "Basic " + new Buffer('q981hmn10d95t1t:wtmt7hgtatm6w0v').toString("base64");

async function getAccessToken(code) {

    var options = {
        uri: 'https://api.dropbox.com/1/oauth2/token?code=' + code + '&grant_type=authorization_code&redirect_uri=http://localhost:8081/authed',
        method: 'POST',
        headers: {
            "Authorization": auth
        },
        json: true
    };


    return rp(options);
}

module.exports = {
    getAccessToken
};
//curl https://api.dropbox.com/1/oauth2/token -d code=<authorization code> -d grant_type=authorization_code -d redirect_uri=<redirect URI> -u <app key>:<app secret>