import { contextBridge, webUtils } from 'electron';

// Expose a safe API to the renderer
// loaded in `new BrowserWindow()`
contextBridge.exposeInMainWorld('electronAPI', {
    getFilePath: (file: any) => {
        return webUtils.getPathForFile(file);
    },
});
