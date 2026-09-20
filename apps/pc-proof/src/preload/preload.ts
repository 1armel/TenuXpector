/**
 * Préchargement : expose uniquement le pont `window.tenu` (étape 6, NFR8).
 */
import { contextBridge, ipcRenderer } from 'electron';
import { createTenuBridge } from './bridge';

const bridge = createTenuBridge((channel, payload) => ipcRenderer.invoke(channel, payload));

contextBridge.exposeInMainWorld('tenu', bridge);
