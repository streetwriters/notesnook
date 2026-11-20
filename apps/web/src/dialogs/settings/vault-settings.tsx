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
import {
  Broom,
  Keyhole,
  Lock,
  PencilSimple,
  TrashSimple
} from "../../components/icons";

export const VaultSettings: SettingsGroup[] = [
  {
    key: "vault",
    section: "vault",
    header: strings.vault(),
    settings: [
      {
        key: "create-vault",
        icon: Keyhole,
        title: strings.createVault(),
        description: strings.createVaultDesc(),
        isHidden: () => useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "navigation",
            action: async () => {
              await Vault.createVault();
            }
          }
        ]
      },
      {
        key: "lock-vault-after",
        icon: Lock,
        title: strings.lockVaultAfter(),
        description: strings.lockVaultAfterDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) => {
          const unsub1 = useAppStore.subscribe(
            (s) => s.vaultLockAfter,
            listener
          );
          const unsub2 = useAppStore.subscribe(
            (s) => s.isVaultCreated,
            listener
          );
          return () => {
            unsub1();
            unsub2();
          };
        },
        components: [
          {
            type: "dropdown",
            options: [
              {
                get title() {
                  return strings.minutes(1);
                },
                value: 1000 * 60 * 1
              },
              {
                get title() {
                  return strings.minutes(5);
                },
                value: 1000 * 60 * 5
              },
              {
                get title() {
                  return strings.minutes(10);
                },
                value: 1000 * 60 * 10
              },
              {
                get title() {
                  return strings.minutes(15);
                },
                value: 1000 * 60 * 15
              },
              {
                get title() {
                  return strings.minutes(30);
                },
                value: 1000 * 60 * 30
              },
              {
                get title() {
                  return strings.minutes(45);
                },
                value: 1000 * 60 * 45
              },
              {
                get title() {
                  return strings.hours(1);
                },
                value: 1000 * 60 * 60
              },
              {
                get title() {
                  return strings.never();
                },
                value: -1
              }
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
        icon: PencilSimple,
        title: strings.changeVaultPassword(),
        description: strings.changeVaultPasswordDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "navigation",
            action: () => Vault.changeVaultPassword()
          }
        ]
      },
      {
        key: "clear-vault",
        icon: Broom,
        title: strings.clearVault(),
        description: strings.clearVaultDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "navigation",
            action: async () => {
              if (await Vault.clearVault()) {
                useNotesStore.getState().refresh();
                showToast("success", strings.vaultCleared());
              }
            }
          }
        ]
      },
      {
        key: "delete-vault",
        destructive: true,
        icon: TrashSimple,
        title: strings.deleteVault(),
        description: strings.deleteVaultDesc(),
        isHidden: () => !useAppStore.getState().isVaultCreated,
        onStateChange: (listener) =>
          useAppStore.subscribe((s) => s.isVaultCreated, listener),
        components: [
          {
            type: "navigation",
            action: async () => {
              if ((await Vault.deleteVault()) && !(await db.vault.exists())) {
                useAppStore.getState().setIsVaultCreated(false);
                await useAppStore.getState().refresh();
                showToast("success", strings.vaultDeleted());
              }
            }
          }
        ]
      }
    ]
  }
];
