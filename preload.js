const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openBookDialog: () => ipcRenderer.invoke('open-book-dialog'),
    readBookFile: (path) => ipcRenderer.invoke('read-book-file', path),
    deleteBookFile: (path) => ipcRenderer.invoke('delete-book-file', path),
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    
    // --- NEW UPDATER API ---
    startDownload: () => ipcRenderer.invoke('start-download'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    
    // General Listener
    ipcRenderer: {
        on: (channel, callback) => ipcRenderer.on(channel, callback),
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
    }
});