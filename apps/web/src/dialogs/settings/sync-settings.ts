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
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { ConfirmDialog } from "../confirm";

import { strings } from "@notesnook/intl";

export const SyncSettings: SettingsGroup[] = [
  {
    key: "sync",
    section: "sync",
    header: strings.sync(),
    settings: [
      {
        key: "toggle-sync",
        title: strings.disableSync(),
        description: strings.disableSyncDesc(),
        keywords: ["sync off", "toggle sync"],
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isSyncEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => !useAppStore.getState().isSyncEnabled,
            toggle: () => useAppStore.getState().toggleSync()
          }
        ]
      },
      {
        key: "toggle-auto-sync",
        title: strings.disableAutoSync(),
        description: strings.disableAutoSyncDesc(),
        keywords: ["auto sync off", "automatic sync", "toggle auto sync"],
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isSyncEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => !useAppStore.getState().isAutoSyncEnabled,
            toggle: () => useAppStore.getState().toggleAutoSync()
          }
        ]
      },
      {
        key: "toggle-realtime-sync",
        title: strings.disableRealtimeSync(),
        description: strings.disableRealtimeSyncDesc(),
        keywords: ["auto sync off", "automatic sync", "toggle auto sync"],
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isSyncEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => !useAppStore.getState().isRealtimeSyncEnabled,
            toggle: () => useAppStore.getState().toggleRealtimeSync()
          }
        ]
      },
      {
        key: "full-offline-mode",
        title: strings.fullOfflineMode(),
        description: strings.fullOfflineModeDesc(),
        keywords: ["offline mode"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.isFullOfflineMode, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().isFullOfflineMode,
            toggle: () => useSettingStore.getState().toggleFullOfflineMode()
          }
        ]
      },
      {
        key: "force-sync",
        title: strings.havingProblemsWithSync(),
        description: strings.havingProblemsWithSyncDesc(),
        keywords: ["force sync", "sync issues", "sync error", "sync problem"],
        components: [
          {
            type: "button",
            title: strings.forcePushChanges(),
            variant: "error",
            action: () =>
              ConfirmDialog.show({
                title: strings.areYouSure(),
                message: strings.forceSyncNotice(),
                checks: {
                  accept: { text: strings.understand(), default: false }
                },
                positiveButtonText: strings.continue(),
                negativeButtonText: strings.cancel()
              }).then((result) => {
                if (!result || !result.accept) return;
                return useAppStore
                  .getState()
                  .sync({ force: true, type: "send" });
              })
          },
          {
            type: "button",
            title: strings.forcePullChanges(),
            variant: "error",
            action: () =>
              ConfirmDialog.show({
                title: strings.areYouSure(),
                message: strings.forcePullChangesDesc(),
                checks: {
                  accept: { text: strings.understand(), default: false }
                },
                positiveButtonText: strings.continue(),
                negativeButtonText: strings.cancel()
              }).then((result) => {
                if (!result || !result.accept) return;
                return useAppStore
                  .getState()
                  .sync({ force: true, type: "fetch" });
              })
          }
        ]
      }
    ]
  }
];
