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
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { BuyDialog } from "../buy-dialog/buy-dialog";
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
              if (!isUserPremium()) BuyDialog.show({});
              else
                Vault.createVault().then((res) => {
                  useAppStore.getState().setIsVaultCreated(res);
                });
            },
            variant: "secondary"
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
