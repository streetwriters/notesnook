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
import { useStore as useUserStore } from "../../stores/user-store";
import { createBackup, verifyAccount } from "../../common";
import {
  show2FARecoveryCodesDialog,
  showMultifactorDialog,
  showPasswordDialog,
  showRecoveryKeyDialog
} from "../../common/dialog-controller";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";

export const AuthenticationSettings: SettingsGroup[] = [
  {
    header: "Password",
    key: "password",
    section: "auth",
    settings: [
      {
        key: "change-password",
        title: "Change password",
        description: "Set a new password for your account",
        keywords: ["change password", "new password"],
        components: [
          {
            type: "button",
            title: "Change password",
            variant: "secondary",
            action: async () => {
              await createBackup();
              const result = await showPasswordDialog(
                "change_account_password",
                async ({ newPassword, oldPassword }) => {
                  if (!newPassword || !oldPassword) return false;
                  await db.user.clearSessions();
                  return (
                    (await db.user.changePassword(oldPassword, newPassword)) ||
                    false
                  );
                }
              );
              if (result) {
                showToast("success", "Account password changed!");
                await showRecoveryKeyDialog();
              }
            }
          }
        ]
      }
    ]
  },
  {
    header: "Two-factor authentication",
    key: "2fa",
    section: "auth",
    settings: [
      {
        key: "2fa-enabled",
        title: "2FA enabled",
        description: "Your account is secured by 2FA.",
        keywords: [],
        components: []
      },
      {
        key: "primary-2fa-method",
        title: "Primary method",
        keywords: ["primary 2fa method"],
        description: () =>
          `Your current 2FA method is ${
            useUserStore.getState().user?.mfa.primaryMethod
          }.`,
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user?.mfa.primaryMethod, listener),
        components: [
          {
            type: "button",
            title: "Change",
            action: async () => {
              if (await verifyAccount()) {
                await showMultifactorDialog();
                await useUserStore.getState().refreshUser();
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "fallback-2fa-method",
        title: "Fallback method",
        description:
          "You can use the fallback 2FA method in case you are unable to login via the primary method.",
        keywords: ["backup 2fa method"],
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user?.mfa.secondaryMethod, listener),
        components: () => [
          {
            type: "button",
            title: useUserStore.getState().user?.mfa.secondaryMethod
              ? "Reconfigure fallback 2FA method"
              : "Add fallback 2FA method",
            variant: "secondary",
            action: async () => {
              if (await verifyAccount()) {
                await showMultifactorDialog(
                  useUserStore.getState().user?.mfa.primaryMethod || "email"
                );
                await useUserStore.getState().refreshUser();
              }
            }
          }
        ]
      },
      {
        key: "recovery-codes",
        title: "Recovery codes",
        description:
          "Recovery codes can be used to login in case you cannot use any of the other 2FA methods.",
        keywords: ["2fa recovery codes"],
        components: [
          {
            type: "button",
            title: "View recovery codes",
            variant: "secondary",
            action: async () => {
              if (await verifyAccount()) {
                await show2FARecoveryCodesDialog(
                  useUserStore.getState().user?.mfa.primaryMethod || "email"
                );
                await useUserStore.getState().refreshUser();
              }
            }
          }
        ]
      }
    ]
  }
];
