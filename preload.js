const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openBookDialog: () => ipcRenderer.invoke('open-book-dialog'),
    readBookFile: (path) => ipcRenderer.invoke('read-book-file', path),
    deleteBookFile: (path) => ipcRenderer.invoke('delete-book-file', path),
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    ipcRenderer: {
        on: (channel, callback) => ipcRenderer.on(channel, callback)
    }
});