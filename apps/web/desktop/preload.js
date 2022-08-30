/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ["fromRenderer"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ["fromMain"];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      // Deliberately strip event as it includes `sender`
      ipcRenderer.addListener(channel, (event, args) => {
        func(args);
      });
    }
  }
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("config", {
  zoomFactor: () => {
    return ipcRenderer.invoke("fromRenderer", {
      type: "getZoomFactor"
    });
  }
});

contextBridge.exposeInMainWorld("native", {
  selectDirectory: ({ title, buttonLabel, defaultPath }) => {
    return ipcRenderer.invoke("fromRenderer", {
      type: "selectDirectory",
      title,
      buttonLabel,
      defaultPath
    });
  }
});
