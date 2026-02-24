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
import { useStore as useNotesStore } from "../../stores/note-store";
import Vault from "../../common/vault";
import { showToast } from "../../utils/toast";
import { db } from "../../common/db";
import { strings } from "@notesnook/intl";

export const VaultSettings: SettingsGroup[] = [
  {
    key: "vault",
    section: "vault",
    header: strings.vault(),
    settings: [
      {
        key: "create-vault",
        title: strings.createVault(),
        isHidden: () => useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "button",
            title: strings.create(),
            action: () => {
              Vault.createVault().then((res) => {
                useAppStore.getState().setIsVaultCreated(res);
              });
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "lock-vault-after",
        title: strings.lockVaultAfter(),
        description:
          strings.lockVaultAfterDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.vaultLockAfter, listener),
        components: [
          {
            type: "dropdown",
            options: [
              { title: "1 minute", value: 1000 * 60 * 1 },
              { title: "5 minutes", value: 1000 * 60 * 5 },
              { title: "10 minutes", value: 1000 * 60 * 10 },
              { title: "15 minutes", value: 1000 * 60 * 15 },
              { title: "30 minutes", value: 1000 * 60 * 30 },
              { title: "45 minutes", value: 1000 * 60 * 45 },
              { title: "1 hour", value: 1000 * 60 * 60 },
              { title: "Never", value: -1 }
            ],
            onSelectionChanged: async (value) => {
              await useAppStore.getState().setVaultLockAfter(parseInt(value));
            },
            selectedOption: () => {
              return useAppStore.getState().vaultLockAfter;
            }
          }
        ]
      },
      {
        key: "change-vault-password",
        title: strings.changeVaultPassword(),
        description: strings.changeVaultPasswordDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "button",
            title: strings.change(),
            action: () => Vault.changeVaultPassword(),
            variant: "secondary"
          }
        ]
      },
      {
        key: "clear-vault",
        title: strings.clearVault(),
        description: strings.clearVaultDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "button",
            title: strings.clear(),
            action: async () => {
              if (await Vault.clearVault()) {
                useNotesStore.getState().refresh();
                showToast("success", strings.vaultCleared());
              }
            },
            variant: "errorSecondary"
          }
        ]
      },
      {
        key: "delete-vault",
        title: strings.deleteVault(),
        description: strings.deleteVaultDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "button",
            title: strings.delete(),
            action: async () => {
              if ((await Vault.deleteVault()) && !(await db.vault.exists())) {
                useAppStore.getState().setIsVaultCreated(false);
                await useAppStore.getState().refresh();
                showToast("success", strings.vaultDeleted());
              }
            },
            variant: "errorSecondary"
          }
        ]
      }
    ]
  }
];
