const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs'); 

let mainWindow; 

// --- AUTO UPDATER CONFIGURATION ---
autoUpdater.autoDownload = false; // Important: We manually trigger download now
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
        // Check for updates as soon as the window is ready
        autoUpdater.checkForUpdatesAndNotify();
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// --- FILE OPENING LOGIC ---
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

ipcMain.handle('delete-book-file', async (event, filePath) => {
    try {
        fs.unlinkSync(filePath);
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
    } else {
        mainWindow.setFullScreen(true);
    }
});

// --- NEW UPDATE HANDLERS ---

// 1. Start Download (Triggered by "Yes" button in UI)
ipcMain.handle('start-download', () => {
    autoUpdater.downloadUpdate();
});

// 2. Quit and Install (Triggered by "Restart" button in UI)
ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});

// --- AUTO UPDATER EVENTS ---

// Event 1: Update Found - Send info to UI (Don't download yet)
autoUpdater.on('update-available', (info) => {
    // Calculate size (in MB) from the files array if available
    let totalSize = 0;
    if (info.files && info.files.length > 0) {
        totalSize = info.files.reduce((acc, file) => acc + file.size, 0);
    }
    
    if (mainWindow) {
        mainWindow.webContents.send('update-available', {
            version: info.version,
            size: totalSize, // Size in bytes
            releaseNotes: info.releaseNotes
        });
    }
});

// Event 2: Download Progress - Send percentage to UI
autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj);
    }
});

// Event 3: Update Ready - Tell UI to show "Restart" button
autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded');
    }
});

// Event 4: Error
autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    if (mainWindow) {
        mainWindow.webContents.send('update-error', err.message);
    }
});