const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const chokidar = require('chokidar');

class CodeVectorMain {
    constructor() {
        this.mainWindow = null;
        this.fileWatcher = null;
        this.currentProject = null;
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            icon: path.join(__dirname, '../assets/icon.png'),
            titleBarStyle: 'default',
            show: false
        });

        this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }

        this.setupIPC();
    }

    setupIPC() {
        // File operations
        ipcMain.handle('read-file', async (event, filePath) => {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                return { success: true, content };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('write-file', async (event, filePath, content) => {
            try {
                await fs.writeFile(filePath, content, 'utf8');
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('open-folder', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory']
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
                const folderPath = result.filePaths[0];
                this.currentProject = folderPath;
                this.startFileWatcher(folderPath);
                return { success: true, path: folderPath };
            }
            
            return { success: false };
        });

        ipcMain.handle('list-files', async (event, dirPath) => {
            try {
                const files = await this.getFileTree(dirPath);
                return { success: true, files };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Manifest watching
        ipcMain.handle('get-manifest', async (event, projectPath) => {
            try {
                const manifestPath = path.join(projectPath, 'package.json');
                const content = await fs.readFile(manifestPath, 'utf8');
                return { success: true, manifest: JSON.parse(content) };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async getFileTree(dirPath, depth = 0) {
        if (depth > 3) return []; // Prevent deep recursion
        
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const files = [];

        for (const item of items) {
            if (item.name.startsWith('.')) continue; // Skip hidden files
            
            const itemPath = path.join(dirPath, item.name);
            const relativePath = path.relative(this.currentProject || dirPath, itemPath);
            
            if (item.isDirectory()) {
                const children = await this.getFileTree(itemPath, depth + 1);
                files.push({
                    name: item.name,
                    path: relativePath,
                    type: 'directory',
                    children
                });
            } else {
                files.push({
                    name: item.name,
                    path: relativePath,
                    type: 'file',
                    extension: path.extname(item.name)
                });
            }
        }

        return files.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    startFileWatcher(projectPath) {
        if (this.fileWatcher) {
            this.fileWatcher.close();
        }

        const manifestPath = path.join(projectPath, 'package.json');
        
        this.fileWatcher = chokidar.watch(manifestPath, {
            persistent: true,
            ignoreInitial: false
        });

        this.fileWatcher.on('change', async () => {
            try {
                const content = await fs.readFile(manifestPath, 'utf8');
                const manifest = JSON.parse(content);
                
                this.mainWindow.webContents.send('manifest-changed', manifest);
            } catch (error) {
                console.error('Error reading manifest:', error);
            }
        });

        this.fileWatcher.on('error', (error) => {
            console.error('File watcher error:', error);
        });
    }

    initialize() {
        app.whenReady().then(() => {
            this.createWindow();

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (this.fileWatcher) {
                this.fileWatcher.close();
            }
            
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('before-quit', () => {
            if (this.fileWatcher) {
                this.fileWatcher.close();
            }
        });
    }
}

const codeVectorApp = new CodeVectorMain();
codeVectorApp.initialize();