import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { release } from 'os';
import path from 'path';
import { autoUpdater } from 'electron-updater';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

let win: BrowserWindow | null = null;
// Dist path
const distPath = path.join(__dirname, '../dist');
// Public path (for preload)
const publicPath = app.isPackaged ? distPath : path.join(__dirname, '../public');
const preload = path.join(__dirname, 'preload.js');

async function createWindow() {
    win = new BrowserWindow({
        title: 'The Tackle Box',
        icon: path.join(publicPath, 'favicon.ico'),
        width: 1200,
        height: 800,
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false, // For simple communication, usually true in stricter apps
        },
    });

    if (app.isPackaged) {
        win.loadFile(path.join(distPath, 'index.html'));
    } else {
        // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
        const url = process.env['VITE_DEV_SERVER_URL'];
        win.loadURL(url || 'http://localhost:3000');
        win.webContents.openDevTools();
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });

    // Check for updates
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        createWindow();
    }
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('update-message', 'Checking for updates...');
});
autoUpdater.on('update-available', (info) => {
    win?.webContents.send('update-message', 'Update available.');
});
autoUpdater.on('update-not-available', (info) => {
    win?.webContents.send('update-message', 'Update not available.');
});
autoUpdater.on('error', (err) => {
    win?.webContents.send('update-message', 'Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    win?.webContents.send('update-message', log_message);
});
autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('update-message', 'Update downloaded');
    // autoUpdater.quitAndInstall(); // Optional: Automatically install
});
