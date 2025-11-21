const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Opens dialog and reads file (Import)
    openBookDialog: () => ipcRenderer.invoke('open-book-dialog'),
    
    // Reads a file from a known path (Open from Library)
    readBookFile: (path) => ipcRenderer.invoke('read-book-file', path),
    
    // Deletes file from disk
    deleteBookFile: (path) => ipcRenderer.invoke('delete-book-file', path),
    
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    
    ipcRenderer: {
        on: (channel, callback) => ipcRenderer.on(channel, callback)
    }
});