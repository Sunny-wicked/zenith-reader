const { contextBridge, ipcRenderer } = require('electron');

// We removed the complex 'path' and 'pdfjs' requires here because
// they were causing the script to crash in your specific environment.

// --- Electron API Bridge ---
contextBridge.exposeInMainWorld('electronAPI', {
    openBookFile: () => ipcRenderer.invoke('open-book-file'),
    
    // NEW: Expose a listener function for the renderer process to receive events
    ipcRenderer: {
        on: (channel, callback) => ipcRenderer.on(channel, callback)
    }
});