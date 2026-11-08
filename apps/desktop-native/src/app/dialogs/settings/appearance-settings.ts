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

import { strings } from "@notesnook/intl";
import { environment } from "@platform";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import type { SettingsGroup } from "./types";

export const AppearanceSettings: SettingsGroup[] = [
  {
    key: "theme",
    section: "appearance",
    header: strings.general(),
    isHidden: () => !environment.isDesktopApp,
    settings: [
      {
        key: "zoom-factor",
        title: strings.zoomFactor(),
        description: strings.zoomFactorDescription(),
        isHidden: () => !environment.isDesktopApp,
        onStateChange: (listener) =>
          useThemeStore.subscribe(
            (s) => [s.colorScheme, s.followSystemTheme],
            listener
          ),
        components: [
          {
            type: "input",
            inputType: "number",
            min: 0.5,
            max: 3.0,
            step: 0.1,
            defaultValue: () => useSettingStore.getState().zoomFactor,
            onChange: (value) => useSettingStore.getState().setZoomFactor(value)
          }
        ]
      }
    ]
  },
  {
    key: "theme",
    section: "appearance",
    header: strings.themes(),
    settings: [
      {
        key: "color-scheme",
        title: strings.colorScheme(),
        description: strings.colorSchemeDescription(),
        onStateChange: (listener) =>
          useThemeStore.subscribe(
            (s) => [s.colorScheme, s.followSystemTheme],
            listener
          ),
        components: [
          {
            type: "dropdown",
            options: [
              { title: strings.light(), value: "light" },
              { title: strings.dark(), value: "dark" },
              { title: strings.auto(), value: "auto" }
            ],
            selectedOption: () =>
              useThemeStore.getState().followSystemTheme
                ? "auto"
                : useThemeStore.getState().colorScheme,
            onSelectionChanged: (value) => {
              useThemeStore.getState().setFollowSystemTheme(value === "auto");
              if (value !== "auto")
                useThemeStore
                  .getState()
                  .setColorScheme(value as "dark" | "light");
            }
          }
        ]
      }
    ]
  }
];
