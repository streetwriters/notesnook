import { getDefaultPresets } from "@streetwriters/editor";
import { useState } from "react";

const settingsJson = localStorage.getItem("editorSettings");
const initialState = {
  fullscreen: false,
  deviceMode: "mobile",
  premium: false,
  tools: JSON.parse(JSON.stringify(getDefaultPresets().default)),
  noToolbar: globalThis.noToolbar,
  noHeader: globalThis.noHeader,
  readonly: globalThis.readonly,
  doubleSpacedLines: true,
};

global.settingsController = {
  update: (settings) => {
    const nextSettings = {
      ...settings,
      noToolbar: globalThis.noToolbar || settings.noToolbar,
      noHeader: globalThis.noHeader || settings.noHeader,
      readonly: globalThis.readonly || settings.readonly,
    };
    if (
      JSON.stringify(nextSettings) ===
      JSON.stringify(global.settingsController.previous)
    ) {
      return;
    }
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
global.settingsController.previous.noHeader = globalThis.noHeader;
global.settingsController.previous.noToolbar = globalThis.noToolbar;
global.settingsController.previous.readonly = globalThis.readonly;

export const useSettings = () => {
  const [settings, setSettings] = useState({
    ...global.settingsController.previous,
  });
  global.settingsController.set = setSettings;

  return settings;
};
