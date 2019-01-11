const express = require('express');
const app = express();
const fs = require("fs");
const fetch = require('isomorphic-fetch');
const Dropbox = require('dropbox').Dropbox;
const {getAccessToken} = require('./src/util')

app.get('/authed', (req, res) => {
    const code = req.query.code;

    getAccessToken(code).then(result => {
        const accessToken = result['access_token'];
        console.log('accessToken=' + accessToken);
        new Dropbox({
            fetch,
            accessToken
        })
            .filesListFolder({path: ''})
            .then(console.log, console.error);
        res.end('its over');


    });


});

const server = app.listen(8081, function () {
    const host = 'localhost';
    const port = 8081;
    console.log("Example app listening at http://%s:%s", host, port)
});