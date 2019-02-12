const {app, BrowserWindow} = require('electron');

function main() {
    // Create the browser window.
    const win = new BrowserWindow({width: 800, height: 600});

    win.setMenu(null);
    // and load the index.html of the app.
    win.loadFile('../app/index.html');
}

app.on('ready', main);