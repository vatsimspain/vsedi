// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { app, contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'install:progress';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  dialog: {
    openFolder: (): Promise<string | null> =>
      ipcRenderer.invoke('dialog:openFolder'),
  },
  install: {
    run: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke('install:run', payload),
  },
  config: {
    load: (): Promise<Record<string, unknown>> =>
      ipcRenderer.invoke('config:load'),
    save: (data: Record<string, unknown>): Promise<void> =>
      ipcRenderer.invoke('config:save', data),
  },
  app: {
    close: () => ipcRenderer.send('app:close'),
  },
  getVersion: () => app.getVersion(),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
