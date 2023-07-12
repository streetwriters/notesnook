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

import { SettingsGroup } from "./types";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useThemeStore } from "../../stores/theme-store";

import { AccentColors } from "./components/accent-colors";

export const AppearanceSettings: SettingsGroup[] = [
  {
    key: "theme",
    section: "appearance",
    header: "Theme",
    settings: [
      {
        key: "accent-color",
        title: "Accent color",
        description: "Pick the color that matches your mood.",
        components: [
          {
            type: "custom",
            component: AccentColors
          }
        ]
      },
      {
        key: "theme",
        title: "App theme",
        description: "Dark or light, we won't judge.",
        onStateChange: (listener) =>
          useThemeStore.subscribe(
            (s) => [s.theme, s.followSystemTheme],
            listener
          ),
        components: [
          {
            type: "dropdown",
            options: [
              { title: "Light", value: "light" },
              { title: "Dark", value: "dark" },
              { title: "Auto", value: "auto" }
            ],
            selectedOption: () =>
              useThemeStore.getState().followSystemTheme
                ? "auto"
                : useThemeStore.getState().theme,
            onSelectionChanged: (value) => {
              useThemeStore.getState().setFollowSystemTheme(value === "auto");
              if (value !== "auto") useThemeStore.getState().setTheme(value);
            }
          }
        ]
      },
      {
        key: "zoom-factor",
        title: "Zoom factor",
        description: "Zoom in or out the app content.",
        isHidden: () => !IS_DESKTOP_APP,
        onStateChange: (listener) =>
          useThemeStore.subscribe(
            (s) => [s.theme, s.followSystemTheme],
            listener
          ),
        components: [
          {
            type: "input",
            inputType: "number",
            min: 0.5,
            max: 2.0,
            defaultValue: () => useSettingStore.getState().zoomFactor,
            onChange: (value) => useSettingStore.getState().setZoomFactor(value)
          }
        ]
      }
    ]
  }
];
