const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (patch) => ipcRenderer.invoke('config:update', patch),
  getLastUsage: () => ipcRenderer.invoke('usage:last'),
  refresh: () => ipcRenderer.invoke('usage:refresh'),
  drag: (dx, dy) => ipcRenderer.invoke('window:drag', { dx, dy }),
  resize: (h) => ipcRenderer.invoke('window:resize', { h }),
  openSettings: () => ipcRenderer.invoke('settings:open'),
  closeSettings: () => ipcRenderer.invoke('settings:close'),
  quit: () => ipcRenderer.invoke('app:quit'),
  openCreds: () => ipcRenderer.invoke('shell:openCreds'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  getUpdate: () => ipcRenderer.invoke('update:get'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  onUsage: (cb) => ipcRenderer.on('usage:update', (_e, payload) => cb(payload)),
  onError: (cb) => ipcRenderer.on('usage:error', (_e, payload) => cb(payload)),
  onConfig: (cb) => ipcRenderer.on('config:changed', (_e, cfg) => cb(cfg)),
  onReset: (cb) => ipcRenderer.on('usage:reset', (_e, payload) => cb(payload)),
  onUpdate: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
});
