const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs'); 

let mainWindow; 

autoUpdater.autoDownload = false; 
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, 
        height: 800,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            contextIsolation: true, 
            nodeIntegration: false
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
        autoUpdater.checkForUpdatesAndNotify();
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// --- 1. OPEN DIALOG & READ (For importing new books) ---
ipcMain.handle('open-book-dialog', async () => {
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

// --- 2. READ SPECIFIC FILE (For opening from Library) ---
ipcMain.handle('read-book-file', async (event, filePath) => {
    try {
        return {
            filePath,
            fileExtension: path.extname(filePath).toLowerCase().substring(1),
            fileData: fs.readFileSync(filePath).toString('base64')
        };
    } catch (error) {
        console.error("Error reading file:", error);
        return { error: "File not found or unreadable" };
    }
});

// --- 3. DELETE FILE (Permanent Deletion) ---
ipcMain.handle('delete-book-file', async (event, filePath) => {
    try {
        fs.unlinkSync(filePath); // Permanently deletes the file
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
});

// --- FULLSCREEN TOGGLE ---
ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
    } else {
        mainWindow.setFullScreen(true);
    }
});

// --- AUTO UPDATER ---
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version of Zenith Reader is available. Do you want to download it now?',
        buttons: ['Yes', 'No']
    }).then(result => {
        if (result.response === 0) { 
            if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading' });
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloaded' });
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. Restart now?',
        buttons: ['Restart', 'Later']
    }).then(result => {
        if (result.response === 0) autoUpdater.quitAndInstall();
    });
});

autoUpdater.on('error', (err) => {
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'error', message: err.message });
});