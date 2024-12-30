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
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { TimeFormat } from "@notesnook/core";
import { TrashCleanupInterval } from "@notesnook/core";
import { strings } from "@notesnook/intl";

export const BehaviourSettings: SettingsGroup[] = [
  {
    key: "general",
    section: "behaviour",
    header: strings.general(),
    isHidden: () => !isUserPremium(),
    settings: [
      {
        key: "default-homepage",
        title: strings.homepage(),
        description: strings.homepageDesc(),
        keywords: ["welcome page", "default screen"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.homepage, listener),
        components: [
          {
            type: "dropdown",
            onSelectionChanged: (value) =>
              useSettingStore.getState().setHomepage(parseInt(value)),
            selectedOption: () =>
              useSettingStore.getState().homepage.toString(),
            options: [
              { value: "0", title: strings.routes.Notes() },
              { value: "1", title: strings.routes.Notebooks() },
              { value: "2", title: strings.routes.Favorites() },
              { value: "3", title: strings.routes.Tags() }
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
            onSelectionChanged: (value) =>
              useSettingStore.getState().setImageCompression(parseInt(value)),
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
            onSelectionChanged: (value) =>
              useSettingStore
                .getState()
                .setTrashCleanupInterval(
                  parseInt(value) as TrashCleanupInterval
                ),
            selectedOption: () =>
              useSettingStore.getState().trashCleanupInterval.toString(),
            options: [
              { value: "1", title: strings.daily() },
              { value: "7", title: strings.days(7) },
              { value: "30", title: strings.days(30) },
              { value: "365", title: strings.days(365) },
              { value: "-1", title: strings.never(), premium: true }
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
        isHidden: () => useSettingStore.getState().isFlatpak,
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
