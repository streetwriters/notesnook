import { DEFAULT_TOOLS } from "notesnook-editor";
import { useEffect, useState } from "react";

const settingsJson = localStorage.getItem("editorSettings");
const initialState = {
  readonly: false,
  fullscreen: false,
  deviceMode: "mobile",
  premium: false,
  tools: DEFAULT_TOOLS,
  noHeader: false,
  noToolbar: false,
};

global.settingsController = {
  update: (settings) => {
    const nextSettings = { ...settingsController.previous, ...settings };
    if (global.settingsController.set)
      global.settingsController.set(nextSettings);
    if (settings) {
      localStorage.setItem("editorSettings", JSON.stringify(nextSettings));
    } else {
      localStorage.removeItem("editorSettings");
    }
    settingsController.previous = { ...nextSettings };
  },
  previous: settingsJson ? JSON.parse(settingsJson) : { ...initialState },
};

export const useSettings = () => {
  const [settings, setSettings] = useState({
    ...global.settingsController.previous,
  });
  global.settingsController.set = setSettings;

  return settings;
};
