const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs'); 

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
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

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