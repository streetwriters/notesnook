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

export const SyncSettings: SettingsGroup[] = [
  {
    key: "sync",
    section: "sync",
    header: "Sync",
    settings: [
      {
        key: "toggle-sync",
        title: "Enable sync",
        description:
          "Disable syncing to prevent all changes from syncing to & from other devices.",
        keywords: ["sync off", "toggle sync"],
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isSyncEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useAppStore.getState().isSyncEnabled,
            toggle: () => useAppStore.getState().toggleSync()
          }
        ]
      },
      {
        key: "toggle-auto-sync",
        title: "Enable auto sync",
        description:
          "Disable auto sync to prevent changes from automatically syncing to other devices. This will require manually pressing the sync button in order to sync changes.",
        keywords: ["auto sync off", "automatic sync", "toggle auto sync"],
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isSyncEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useAppStore.getState().isAutoSyncEnabled,
            toggle: () => useAppStore.getState().toggleAutoSync()
          }
        ]
      },

      {
        key: "toggle-realtime-sync",
        title: "Enable realtime editor sync",
        description:
          "Disable realtime editor sync to prevent edits from updating in realtime on this device. This will require closing and opening the note to see new changes.",
        keywords: ["auto sync off", "automatic sync", "toggle auto sync"],
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isSyncEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useAppStore.getState().isRealtimeSyncEnabled,
            toggle: () => useAppStore.getState().toggleRealtimeSync()
          }
        ]
      },
      {
        key: "full-offline-mode",
        title: "Full offline mode",
        description: "Download everything including attachments on sync",
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
        title: "Having problems with sync?",
        description: `Force push:
Use this if changes made on this device are not appearing on other devices. This will overwrite the data on the server with the data from this device.

Force pull:
Use this if changes from other devices are not appearing on this device. This will overwrite the data on this device with the latest data from the server.

**These must only be used for troubleshooting. Using them regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.**`,
        keywords: ["force sync", "sync troubleshoot"],
        components: [
          {
            type: "button",
            title: "Force push",
            variant: "error",
            action: () =>
              ConfirmDialog.show({
                title: "Are you sure?",
                message:
                  "This must only be used for troubleshooting. Using them regularly for sync is **not recommended** and will lead to **unexpected data loss** and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.",
                checks: {
                  accept: { text: "I understand.", default: false }
                },
                positiveButtonText: "Proceed",
                negativeButtonText: "Cancel"
              }).then((result) => {
                if (!result || !result.accept) return;
                return useAppStore
                  .getState()
                  .sync({ force: true, type: "send" });
              })
          },
          {
            type: "button",
            title: "Force pull",
            variant: "error",
            action: () =>
              ConfirmDialog.show({
                title: "Are you sure?",
                message:
                  "This must only be used for troubleshooting. Using them regularly for sync is **not recommended** and will lead to **unexpected data loss** and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.",
                checks: {
                  accept: { text: "I understand.", default: false }
                },
                positiveButtonText: "Proceed",
                negativeButtonText: "Cancel"
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
