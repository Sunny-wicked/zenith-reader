const { contextBridge, ipcRenderer } = require('electron');

// We removed the complex 'path' and 'pdfjs' requires here because
// they were causing the script to crash in your specific environment.

// --- Electron API Bridge ---
// This is the ONLY job of this script now.
contextBridge.exposeInMainWorld('electronAPI', {
    openBookFile: () => ipcRenderer.invoke('open-book-file')
});