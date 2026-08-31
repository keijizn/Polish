const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('polishAPI', {
  correctText: (text, provider) =>
    ipcRenderer.invoke('correct-text', text, provider),

  changeTone: (text, tone, provider) =>
    ipcRenderer.invoke('change-tone', text, tone, provider),

  translateText: (text, language, provider) =>
    ipcRenderer.invoke('translate-text', text, language, provider),

  saveNote: (content) =>
    ipcRenderer.invoke('save-note', content),

  getNotes: () =>
    ipcRenderer.invoke('get-notes'),

  deleteNote: (id) =>
    ipcRenderer.invoke('delete-note', id),

  saveApiKeys: (keys) =>
    ipcRenderer.invoke('save-api-keys', keys),

  getApiKeys: () =>
    ipcRenderer.invoke('get-api-keys'),
});
