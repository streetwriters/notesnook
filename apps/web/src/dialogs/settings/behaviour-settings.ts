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

import { DATE_FORMATS } from "@notesnook/core";
import { SettingsGroup } from "./types";
import {
  ImageCompressionOptions,
  useStore as useSettingStore
} from "../../stores/setting-store";
import dayjs from "dayjs";
import { TimeFormat } from "@notesnook/core";
import { TrashCleanupInterval } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { BuyDialog } from "../buy-dialog";
import { isFeatureAvailable } from "@notesnook/common";
import { showFeatureNotAllowedToast } from "../../common/toasts";

export const BehaviourSettings: SettingsGroup[] = [
  {
    key: "general",
    section: "behaviour",
    header: strings.general(),
    settings: [
      {
        key: "default-sidebar-tab",
        title: strings.defaultSidebarTab(),
        description: strings.defaultSidebarTabDesc(),
        keywords: ["default sidebar tab"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.defaultSidebarTab, listener),
        components: [
          {
            type: "dropdown",
            onSelectionChanged: async (value) => {
              const defaultSidebarTab = await isFeatureAvailable(
                "defaultSidebarTab"
              );
              if (!defaultSidebarTab.isAllowed) {
                BuyDialog.show({ plan: defaultSidebarTab.availableOn });
                return;
              }

              useSettingStore.getState().setDefaultSidebarTab(value as any);
            },
            selectedOption: () => useSettingStore.getState().defaultSidebarTab,
            options: [
              { value: "home", title: strings.routes.Notes() },
              { value: "notebooks", title: strings.routes.Notebooks() },
              { value: "tags", title: strings.routes.Tags() }
            ]
          }
        ]
      },
      {
        key: "image-compression",
        title: strings.imageCompression(),
        description: strings.imageCompressionDesc(),
        keywords: ["compress images", "image quality"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.imageCompression, listener),
        components: [
          {
            type: "dropdown",
            onSelectionChanged: async (value) => {
              if (value === ImageCompressionOptions.DISABLE.toString()) {
                const result = await isFeatureAvailable("fullQualityImages");
                if (!result.isAllowed)
                  return showFeatureNotAllowedToast(result);
              }

              useSettingStore.getState().setImageCompression(parseInt(value));
            },
            selectedOption: () =>
              useSettingStore.getState().imageCompression.toString(),
            options: [
              {
                value: ImageCompressionOptions.ASK_EVERY_TIME.toString(),
                title: strings.askEveryTime()
              },
              {
                value: ImageCompressionOptions.ENABLE.toString(),
                title: strings.enableRecommended()
              },
              {
                value: ImageCompressionOptions.DISABLE.toString(),
                title: strings.disable()
              }
            ]
          }
        ]
      }
    ]
  },
  {
    key: "date-time",
    section: "behaviour",
    header: strings.dateAndTime(),
    settings: [
      {
        key: "date-format",
        title: strings.dateFormat(),
        description: strings.dateFormatDesc(),
        keywords: [],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.dateFormat, listener),
        components: [
          {
            type: "dropdown",
            onSelectionChanged: (value) =>
              useSettingStore.getState().setDateFormat(value),
            selectedOption: () => useSettingStore.getState().dateFormat,
            options: DATE_FORMATS.map((a) => ({
              value: a,
              title: `${a} (${dayjs(Date.now()).format(a)})`
            }))
          }
        ]
      },
      {
        key: "time-format",
        title: strings.timeFormat(),
        description: strings.timeFormatDesc(),
        keywords: [],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.timeFormat, listener),
        components: [
          {
            type: "dropdown",
            onSelectionChanged: (value) =>
              useSettingStore.getState().setTimeFormat(value as TimeFormat),
            selectedOption: () => useSettingStore.getState().timeFormat,
            options: [
              { value: "12-hour", title: "12h" },
              { value: "24-hour", title: "24h" }
            ]
          }
        ]
      }
    ]
  },
  {
    key: "trash",
    section: "behaviour",
    header: strings.trash(),
    settings: [
      {
        key: "trash-cleanup-interval",
        title: strings.clearTrashInterval(),
        description: strings.clearTrashIntervalDesc(),
        keywords: ["clear trash", "trash cleanup interval"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.trashCleanupInterval, listener),
        components: [
          {
            type: "dropdown",
            onSelectionChanged: async (value) => {
              const disableTrashCleanup = await isFeatureAvailable(
                "disableTrashCleanup"
              );
              if (value === "-1" && !disableTrashCleanup.isAllowed) {
                BuyDialog.show({ plan: disableTrashCleanup.availableOn });
                return;
              }

              useSettingStore
                .getState()
                .setTrashCleanupInterval(
                  parseInt(value) as TrashCleanupInterval
                );
            },
            selectedOption: () =>
              useSettingStore.getState().trashCleanupInterval.toString(),
            options: [
              { value: "1", title: strings.daily() },
              { value: "7", title: strings.days(7) },
              { value: "30", title: strings.days(30) },
              { value: "365", title: strings.days(365) },
              { value: "-1", title: strings.never() }
            ]
          }
        ]
      }
    ]
  },
  {
    key: "desktop-app",
    section: "behaviour",
    header: strings.desktopApp(),
    isHidden: () => !IS_DESKTOP_APP,
    settings: [
      {
        key: "auto-updates",
        title: strings.automaticUpdates(),
        description: strings.automaticUpdatesDesc(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.autoUpdates, listener),
        isHidden: () =>
          useSettingStore.getState().isFlatpak ||
          useSettingStore.getState().isSnap,
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().autoUpdates,
            toggle: () => useSettingStore.getState().toggleAutoUpdates()
          }
        ]
      }
    ]
  }
];
