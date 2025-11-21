const { contextBridge, ipcRenderer } = require('electron');

// --- Electron API Bridge ---
contextBridge.exposeInMainWorld('electronAPI', {
    openBookFile: () => ipcRenderer.invoke('open-book-file'),
    
    // NEW: Expose the toggle fullscreen function
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    
    // Listener for renderer process events (updates)
    ipcRenderer: {
        on: (channel, callback) => ipcRenderer.on(channel, callback)
    }
});