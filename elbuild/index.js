const {app, BrowserWindow, globalShortcut} = require('electron');

function main() {
    // Create the browser window.
    const win = new BrowserWindow({width: 800, height: 600});

    win.setMenu(null);
    globalShortcut.register('f5', () => {
        console.log('f5 is pressed');
        win.reload();
    });
    globalShortcut.register('CommandOrControl+R', () => {
        console.log('CommandOrControl+R is pressed');
        win.reload();
    });
    // and load the index.html of the app.
    win.loadFile('../app/index.html');
    win.webContents.openDevTools();

}

app.on('ready', main);