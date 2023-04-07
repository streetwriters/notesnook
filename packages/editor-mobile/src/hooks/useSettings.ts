/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { getDefaultPresets } from "@notesnook/editor";
import { useState } from "react";
import { Settings } from "../utils";

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
  fontFamily: "sans-serif",
  fontSize: "16px"
};

global.settingsController = {
  update: (settings) => {
    const nextSettings = {
      ...settings,
      noToolbar: globalThis.noToolbar || settings.noToolbar,
      noHeader: globalThis.noHeader || settings.noHeader,
      readonly: globalThis.readonly || settings.readonly
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
  previous: settingsJson ? JSON.parse(settingsJson) : { ...initialState }
};
global.settingsController.previous.noHeader = globalThis.noHeader;
global.settingsController.previous.noToolbar = globalThis.noToolbar;
global.settingsController.previous.readonly = globalThis.readonly;

export const useSettings = (): Settings => {
  const [settings, setSettings] = useState({
    ...global.settingsController.previous
  });
  global.settingsController.set = setSettings;

  return settings;
};
