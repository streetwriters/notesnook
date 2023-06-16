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
import { useStore as useNotesStore } from "../../../stores/note-store";
import { hashNavigate } from "../../../navigation";
import Vault from "../../../common/vault";
import { showToast } from "../../../utils/toast";
import { db } from "../../../common/db";

export const VaultSettings: SettingsGroup[] = [
  {
    key: "vault",
    section: "vault",
    header: "Vault",
    settings: [
      {
        key: "reminders",
        title: "Create vault",
        isHidden: () => useAppStore.getState().isVaultCreated,
        components: [
          {
            type: "button",
            title: "Create",
            action: () => hashNavigate("/vault/create"),
            variant: "secondary"
          }
        ]
      },
      {
        key: "reminders",
        title: "Change vault password",
        description: "Set a new password for your vault",
        isHidden: () => !useAppStore.getState().isVaultCreated,
        components: [
          {
            type: "button",
            title: "Change",
            action: () => hashNavigate("/vault/create"),
            variant: "secondary"
          }
        ]
      },
      {
        key: "reminders",
        title: "Clear vault",
        description: "Unlock all locked notes and clear vault.",
        isHidden: () => !useAppStore.getState().isVaultCreated,
        components: [
          {
            type: "button",
            title: "Clear",
            action: async () => {
              if (await Vault.clearVault()) {
                useNotesStore.getState().refresh();
                showToast("success", "Vault cleared.");
              }
            },
            variant: "errorSecondary"
          }
        ]
      },
      {
        key: "reminders",
        title: "Delete vault",
        description: "Delete vault including all locked notes.",
        isHidden: () => !useAppStore.getState().isVaultCreated,
        components: [
          {
            type: "button",
            title: "Delete",
            action: async () => {
              if ((await Vault.deleteVault()) && !(await db.vault?.exists())) {
                useAppStore.getState().setIsVaultCreated(false);
                await useAppStore.getState().refresh();
                showToast("success", "Vault deleted.");
              }
            },
            variant: "errorSecondary"
          }
        ]
      }
    ]
  }
];
