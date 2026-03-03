const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

let viteServer;
const PORT = 3000;

async function startDevServer() {
    console.log(`🚀 Starting Vite dev server on port ${PORT}...`);
    viteServer = spawn('npm', ['run', 'dev', '--', '--port', PORT], { 
        cwd: __dirname, 
        stdio: 'inherit' 
    });
    
    await waitOn({
        resources: [`http://localhost:${PORT}`],
        timeout: 30000 
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1080,
        height: 1920,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadURL(`http://localhost:${PORT}`);
    
    // Open DevTools if you want
    // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
    await startDevServer();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (viteServer) viteServer.kill();
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    if (viteServer) viteServer.kill();
});
