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
import DateFormat from "../../../components/sheets/date-format";
import TrashInterval from "../../../components/sheets/trash-interval";
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
          id: "navigation-group",
          type: "group",
          name: strings.navigation(),
          sections: [
            {
              id: "default-sidebar-view",
              type: "component",
              name: strings.defaultSidebarTab(),
              description: strings.defaultSidebarTabDesc(),
              component: "sidebar-tab-selector",
              icon: "table",
              iconFamily: "notesnook"
            }
          ]
        },
        {
          id: "date-time-group",
          name: strings.dateAndTime(),
          type: "group",
          sections: [
            {
              id: "date-format",
              name: strings.dateFormat(),
              description: strings.dateFormatDesc(),
              icon: "calendar",
              iconFamily: "notesnook",
              isModal: true,
              modifer: () => {
                DateFormat.present();
              }
            },
            {
              id: "day-format",
              name: strings.dayFormat(),
              description: strings.dayFormatDesc(),
              type: "component",
              component: "day-format-selector",
              icon: "calendar-check",
              iconFamily: "notesnook"
            },
            {
              id: "week-format",
              name: strings.weekFormat(),
              description: strings.weekFormatDesc(),
              type: "component",
              component: "week-format-selector",
              icon: "calendar-dots",
              iconFamily: "notesnook"
            },
            {
              id: "time-format",
              name: strings.timeFormat(),
              description: strings.timeFormatDesc(),
              type: "component",
              component: "time-format-selector",
              icon: "clock",
              iconFamily: "notesnook"
            }
          ]
        },
        {
          id: "miscellaneous-group",
          type: "group",
          name: strings.miscellaneous(),
          sections: [
            {
              id: "clear-trash-interval",
              name: strings.clearTrashInterval(),
              description: strings.clearTrashIntervalDesc(),
              icon: "trash",
              iconFamily: "notesnook",
              isModal: true,
              modifer: () => {
                TrashInterval.present();
              }
            },
            {
              id: "image-compression",
              type: "component",
              name: strings.imageCompression(),
              description: strings.imageCompressionDesc(),
              component: "image-compression-picker",
              icon: "arrows-clockwise",
              iconFamily: "notesnook"
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
              hidden: () => !db.settings.getDefaultNotebook(),
              icon: "bookmark",
              iconFamily: "notesnook"
            },
            {
              id: "disable-update-check",
              type: "switch",
              name: strings.autoUpdateCheck(),
              description: strings.autoUpdateCheckDesc(),
              property: "checkForUpdates",
              icon: "arrow-clockwise",
              iconFamily: "notesnook"
            }
          ]
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
          id: "toolbar-group",
          name: strings.toolbar(),
          type: "group",
          sections: [
            {
              id: "configure-toolbar",
              type: "screen",
              name: strings.customizeToolbar(),
              description: strings.customizeToolbarDesc(),
              icon: "wrench",
              iconFamily: "notesnook",
              component: "configuretoolbar",
              headerBottomBorder: true
            },
            {
              id: "reset-toolbar",
              name: strings.resetToolbar(),
              icon: "arrow-counter-clockwise",
              iconFamily: "notesnook",
              description: strings.resetToolbarDesc(),
              modifer: () => {
                useDragState.getState().setPreset("default");
                ToastManager.show({
                  heading: strings.toolbarReset(),
                  type: "success"
                });
              }
            }
          ]
        },
        {
          id: "typography-group",
          name: strings.typography(),
          type: "group",
          sections: [
            {
              id: "default-font-family",
              name: strings.defaultFontFamily(),
              description: strings.defaultFontFamilyDesc(),
              type: "component",
              icon: "text-aa",
              iconFamily: "notesnook",
              property: "defaultFontFamily",
              component: "font-selector"
            },
            {
              id: "default-font-size",
              name: strings.defaultFontSize(),
              description: strings.defaultFontSizeDesc(),
              type: "input-selector",
              minInputValue: 1,
              maxInputValue: 400,
              step: 1,
              inputBadgeValue: "px",
              icon: "text-aa",
              iconFamily: "notesnook",
              property: "defaultFontSize"
            },
            {
              id: "default-line-height",
              name: strings.lineHeight(),
              description: strings.lineHeightDesc(),
              type: "input-selector",
              property: "defaultLineHeight",
              icon: "list",
              iconSize: 8,
              iconFamily: "notesnook",
              minInputValue: EDITOR_LINE_HEIGHT.MIN,
              maxInputValue: EDITOR_LINE_HEIGHT.MAX,
              step: 0.1
            }
          ]
        },
        {
          id: "formatting-group",
          name: strings.formatting(),
          type: "group",
          sections: [
            {
              id: "double-spaced-lines",
              name: strings.doubleSpacedLines(),
              description: strings.doubleSpacedLinesDesc(),
              type: "switch",
              property: "doubleSpacedLines",
              icon: "list",
              iconFamily: "notesnook",
              iconSize: 8,
              onChange: () => {
                ToastManager.show({
                  heading: strings.lineSpacingChanged(),
                  type: "success"
                });
              }
            },
            {
              id: "toggle-markdown",
              name: strings.mardownShortcuts(),
              property: "markdownShortcuts",
              icon: "markdown",
              iconFamily: "notesnook",
              description: strings.mardownShortcutsDesc(),
              type: "switch",
              featureId: "markdownShortcuts"
            }
          ]
        },
        {
          id: "note-title-group",
          type: "group",
          name: strings.newNoteTitle(),
          sections: [
            {
              id: "title-format",
              name: strings.titleFormat(),
              component: "title-format",
              icon: "article-ny-times",
              iconFamily: "notesnook",
              description: strings.titleFormatDesc(),
              type: "component"
            }
          ]
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
      component: "server-config",
      headerBottomBorder: true
    }
  ]
};
