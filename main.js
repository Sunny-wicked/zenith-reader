const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs'); 

// --- AUTO UPDATER CONFIGURATION ---
autoUpdater.autoDownload = false; // We ask the user before downloading
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            contextIsolation: true, 
            nodeIntegration: false
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    // Check for updates once the window is ready
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// --- FILE OPENING LOGIC ---
ipcMain.handle('open-book-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Books', extensions: ['epub', 'pdf'] }]
    });
    if (canceled || !filePaths[0]) return { canceled: true };

    const filePath = filePaths[0];
    return {
        filePath,
        fileExtension: path.extname(filePath).toLowerCase().substring(1),
        fileData: fs.readFileSync(filePath).toString('base64')
    };
});

// --- AUTO UPDATER EVENTS ---

// 1. Update Available - Ask user if they want to download
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version of Zenith Reader is available. Do you want to download it now?',
        buttons: ['Yes', 'No']
    }).then(result => {
        if (result.response === 0) { // If user clicks "Yes"
            autoUpdater.downloadUpdate();
        }
    });
});

// 2. Update Downloaded - Ask user to restart
autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded. Restart the application to apply the updates.',
        buttons: ['Restart', 'Later']
    }).then(result => {
        if (result.response === 0) { // If user clicks "Restart"
            autoUpdater.quitAndInstall();
        }
    });
});

// 3. Error Handling
autoUpdater.on('error', (err) => {
    console.log('Update error: ', err);
});