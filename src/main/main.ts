/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { exec, execSync } from 'child_process';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { runInstall, loadConfig, saveConfig, get, scanInstalledAiracs, installEuroscopeMsi } from './installHandler';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('update:available', info);
    });

    autoUpdater.on('download-progress', (progress) => {
      mainWindow?.webContents.send('update:progress', progress);
    });

    autoUpdater.on('update-downloaded', (info) => {
      mainWindow?.webContents.send('update:downloaded', info);
    });

    autoUpdater.on('error', (err) => {
      log.error('Auto-updater error:', err);
      mainWindow?.webContents.send('update:error', err.message);
    });

    autoUpdater.checkForUpdates();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.handle('install:run', runInstall);
ipcMain.handle('config:load', loadConfig);
ipcMain.handle('config:save', saveConfig);
ipcMain.handle('airac:scan', scanInstalledAiracs);

ipcMain.on('app:close', () => {
  mainWindow?.close();
});

ipcMain.on('update:install', () => {
  autoUpdater.quitAndInstall();
});

const EUROSCOPE_FALLBACK = 'C:\\Program Files (x86)\\EuroScope\\EuroScope.exe';

function findEuroscopeInfo(): {
  exePath: string | null;
  version: string | null;
} {
  // The EuroScope MSI installer always leaves InstallLocation and DisplayIcon
  // empty in the registry (confirmed via MsiGetProductInfo). Registry-based
  // path detection is therefore unreliable. We check known filesystem paths
  // directly, which is fast and covers all normal install locations.
  const candidates: string[] = [];
  try {
    const out = execSync('fsutil fsinfo drives', {
      encoding: 'utf8',
      timeout: 3000,
      windowsHide: true,
    });
    for (const drive of out.match(/[A-Z]:\\/gi) ?? ['C:\\']) {
      const d = drive.replace('\\', '');
      candidates.push(path.join(d + '\\', 'Program Files (x86)', 'EuroScope', 'EuroScope.exe'));
      candidates.push(path.join(d + '\\', 'EuroScope', 'EuroScope.exe'));
    }
  } catch {
    candidates.push(EUROSCOPE_FALLBACK);
  }

  const exePath = candidates.find((c) => fs.existsSync(c)) ?? null;
  if (!exePath) return { exePath: null, version: null };

  // Version: try the current MSI product key, then the older Inno Setup key.
  // Both are direct lookups — no recursive search.
  let version: string | null = null;
  const versionKeys = [
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{311B700B-A574-47EE-ACE0-D8F0C14F25D4}',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\EuroScope_is1',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\EuroScope_is1',
  ];
  for (const key of versionKeys) {
    try {
      const out = execSync(`reg query "${key}" /v DisplayVersion`, {
        encoding: 'utf8',
        timeout: 2000,
        windowsHide: true,
      });
      const match = out.match(/DisplayVersion\s+REG_SZ\s+(.+)/);
      if (match) { version = match[1].trim(); break; }
    } catch { /* try next */ }
  }

  return { exePath, version };
}

ipcMain.handle('euroscope:exists', () => {
  return findEuroscopeInfo().exePath !== null;
});

ipcMain.handle('euroscope:getInfo', () => {
  const { exePath, version } = findEuroscopeInfo();
  return { installed: exePath !== null, exePath, version };
});

ipcMain.handle('euroscope:installMsi', installEuroscopeMsi);

ipcMain.on('euroscope:launch', () => {
  const exePath = findEuroscopeInfo().exePath ?? EUROSCOPE_FALLBACK;
  exec(`"${exePath}"`);
});

ipcMain.handle('http:getText', async (_event, url: string) => {
  const buf = await get(url);
  return buf.toString('utf-8');
});

ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar carpeta de sectores de Euroscope',
  });
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1444,
    height: 920,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
