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
import { useStore as useAppStore } from "../../../stores/app-store";

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
        key: "force-sync",
        title: "Having problems with sync?",
        description: "Try force sync to resolve issues with syncing.",
        keywords: ["force sync", "sync troubleshoot"],
        components: [
          {
            type: "button",
            title: "Force sync",
            variant: "error",
            action: () => useAppStore.getState().sync(true, true)
          }
        ]
      }
    ]
  }
];
