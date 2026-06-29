import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { join } from 'path';
import { setupDatabase } from './database';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,              // 无边框窗口（自定义标题栏）
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,               // 先隐藏，ready-to-show再显示
  });

  // 窗口准备好后显示（避免白屏闪烁）
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // 开发模式加载Vite dev server
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ========== IPC处理 ==========
function setupIPC(): void {
  // 窗口控制
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
    return mainWindow?.isMaximized();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());

  // 文件选择对话框
  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: options?.filters || [
        { name: '文档', extensions: ['pdf', 'docx', 'txt', 'md'] },
      ],
    });
    return result.canceled ? [] : result.filePaths;
  });

  // 在系统浏览器中打开链接
  ipcMain.handle('shell:openExternal', (_event, url: string) => {
    return shell.openExternal(url);
  });

  // 获取应用版本
  ipcMain.handle('app:getVersion', () => app.getVersion());
}

// ========== 应用生命周期 ==========
app.whenReady().then(() => {
  setupIPC();
  setupDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
