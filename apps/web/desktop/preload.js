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
