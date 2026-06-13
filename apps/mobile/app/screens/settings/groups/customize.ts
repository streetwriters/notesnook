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
import { Appearance } from "react-native";
import { db } from "../../../common/database";
import SettingsService from "../../../services/settings";
import { useThemeStore } from "../../../stores/use-theme-store";
import { EDITOR_LINE_HEIGHT } from "../../../utils/constants";
import { ToastManager } from "../../../services/event-manager";
import { useDragState } from "../components/editor/state";
import { SettingSection } from "../types";

export const customizeGroup: SettingSection = {
  id: "customize",
  name: strings.customization(),
  sections: [
    {
      id: "personalization",
      type: "screen",
      name: strings.appearance(),
      description: strings.appearanceDesc(),
      icon: "squares-four",
      iconFamily: "notesnook",
      sections: [
        {
          id: "appearance-group",
          type: "group",
          name: strings.appearance(),
          sections: [
            {
              id: "theme-picker",
              type: "screen",
              name: strings.themes(),
              description: strings.themesDesc(),
              component: "theme-selector",
              icon: "paint-roller",
              iconFamily: "notesnook"
            },
            {
              id: "use-system-theme",
              type: "switch",
              name: strings.useSystemTheme(),
              description: strings.useSystemThemeDesc(),
              property: "useSystemTheme",
              icon: "swatches",
              iconFamily: "notesnook",
              modifer: () => {
                const current = SettingsService.get().useSystemTheme;
                SettingsService.set({
                  useSystemTheme: !current
                });
                if (!current) {
                  const systemColorScheme = Appearance.getColorScheme();
                  useThemeStore
                    .getState()
                    .setColorScheme(
                      systemColorScheme === "dark" ? "dark" : "light"
                    );
                }
              }
            },
            {
              id: "enable-dark-mode",
              type: "switch",
              name: strings.darkMode(),
              description: strings.darkModeDesc(),
              property: "colorScheme",
              icon: "moon",
              iconFamily: "notesnook",
              modifer: () => {
                useThemeStore.getState().setColorScheme();
              },
              getter: () => useThemeStore.getState().colorScheme === "dark"
            }
          ]
        }
      ]
    },
    {
      id: "behaviour",
      type: "screen",
      icon: "sliders-horizontal",
      iconFamily: "notesnook",
      name: strings.behavior(),
      description: strings.behaviorDesc(),
      sections: [
        {
          id: "default-sidebar-view",
          type: "component",
          name: strings.defaultSidebarTab(),
          description: strings.defaultSidebarTabDesc(),
          component: "sidebar-tab-selector"
        },
        {
          id: "date-format",
          name: strings.dateFormat(),
          description: strings.dateFormatDesc(),
          type: "component",
          component: "date-format-selector",
          icon: "calendar-blank"
        },
        {
          id: "day-format",
          name: strings.dayFormat(),
          description: strings.dayFormatDesc(),
          type: "component",
          component: "day-format-selector",
          icon: "calendar-today"
        },
        {
          id: "week-format",
          name: strings.weekFormat(),
          description: strings.weekFormatDesc(),
          type: "component",
          component: "week-format-selector",
          icon: "calendar"
        },
        {
          id: "time-format",
          name: strings.timeFormat(),
          description: strings.timeFormatDesc(),
          type: "component",
          component: "time-format-selector",
          icon: "clock-digital"
        },
        {
          id: "clear-trash-interval",
          type: "component",
          name: strings.clearTrashInterval(),
          description: strings.clearTrashIntervalDesc(),
          component: "trash-interval-selector",
          icon: "delete"
        },
        {
          id: "default-notebook",
          name: strings.clearDefaultNotebook(),
          description: strings.clearDefaultNotebookDesc(),
          modifer: () => {
            db.settings.setDefaultNotebook(undefined);
            ToastManager.show({
              heading: strings.defaultNotebookCleared(),
              type: "success"
            });
          },
          disabled: () => !db.settings.getDefaultNotebook(),
          icon: "notebook-minus"
        },
        {
          id: "disable-update-check",
          type: "switch",
          name: strings.autoUpdateCheck(),
          description: strings.autoUpdateCheckDesc(),
          property: "checkForUpdates",
          icon: "update"
        },
        {
          id: "image-compression",
          type: "component",
          name: strings.imageCompression(),
          description: strings.imageCompressionDesc(),
          component: "image-compression-picker",
          icon: "image-area"
        }
      ]
    },
    {
      id: "editor",
      name: strings.editor(),
      type: "screen",
      icon: "pencil-simple-line",
      iconFamily: "notesnook",
      description: strings.editorDesc(),
      sections: [
        {
          id: "configure-toolbar",
          type: "screen",
          name: strings.customizeToolbar(),
          description: strings.customizeToolbarDesc(),
          component: "configuretoolbar"
        },
        {
          id: "reset-toolbar",
          name: strings.resetToolbar(),
          description: strings.resetToolbarDesc(),
          modifer: () => {
            useDragState.getState().setPreset("default");
            ToastManager.show({
              heading: strings.toolbarReset(),
              type: "success"
            });
          }
        },
        {
          id: "double-spaced-lines",
          name: strings.doubleSpacedLines(),
          description: strings.doubleSpacedLinesDesc(),
          type: "switch",
          property: "doubleSpacedLines",
          icon: "format-line-spacing",
          onChange: () => {
            ToastManager.show({
              heading: strings.lineSpacingChanged(),
              type: "success"
            });
          }
        },
        {
          id: "default-font-size",
          name: strings.defaultFontSize(),
          description: strings.defaultFontSizeDesc(),
          type: "input-selector",
          minInputValue: 8,
          maxInputValue: 120,
          icon: "format-size",
          property: "defaultFontSize"
        },
        {
          id: "default-font-family",
          name: strings.defaultFontFamily(),
          description: strings.defaultFontFamilyDesc(),
          type: "component",
          icon: "format-font",
          property: "defaultFontFamily",
          component: "font-selector"
        },
        {
          id: "default-line-height",
          name: strings.lineHeight(),
          description: strings.lineHeightDesc(),
          type: "input-selector",
          property: "defaultLineHeight",
          icon: "format-line-spacing",
          minInputValue: EDITOR_LINE_HEIGHT.MIN,
          maxInputValue: EDITOR_LINE_HEIGHT.MAX
        },
        {
          id: "title-format",
          name: strings.titleFormat(),
          component: "title-format",
          description: strings.titleFormatDesc(),
          type: "component"
        },
        {
          id: "toggle-markdown",
          name: strings.mardownShortcuts(),
          property: "markdownShortcuts",
          description: strings.mardownShortcutsDesc(),
          type: "switch",
          featureId: "markdownShortcuts"
        }
      ]
    },
    {
      id: "servers",
      type: "screen",
      name: strings.servers(),
      description: strings.serversConfigurationDesc(),
      icon: "hard-drives",
      iconFamily: "notesnook",
      component: "server-config"
    }
  ]
};
