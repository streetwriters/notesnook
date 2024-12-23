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
import { showPasswordDialog } from "../../dialogs/password-dialog";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";
import { RecoveryCodesDialog } from "../mfa/recovery-code-dialog";
import { MultifactorDialog } from "../mfa/multi-factor-dialog";
import { RecoveryKeyDialog } from "../recovery-key-dialog";
import { strings } from "@notesnook/intl";

export const AuthenticationSettings: SettingsGroup[] = [
  {
    header: strings.password(),
    key: "password",
    section: "auth",
    settings: [
      {
        key: "change-password",
        title: strings.changePassword(),
        description: strings.changePassword(),
        keywords: [strings.changePassword(), strings.newPassword()],
        components: [
          {
            type: "button",
            title: strings.changePassword(),
            variant: "secondary",
            action: async () => {
              const result = await showPasswordDialog({
                title: strings.changePassword(),
                message: strings.changePasswordDesc(),
                inputs: {
                  oldPassword: {
                    label: strings.oldPassword(),
                    autoComplete: "current-password"
                  },
                  newPassword: {
                    label: strings.newPassword(),
                    autoComplete: "new-password"
                  }
                },
                validate: async ({ oldPassword, newPassword }) => {
                  if (!(await createBackup())) return false;
                  await db.user.clearSessions();
                  return (
                    (await db.user.changePassword(oldPassword, newPassword)) ||
                    false
                  );
                }
              });
              if (result) {
                showToast("success", strings.passwordChangedSuccessfully());
                await RecoveryKeyDialog.show({});
              }
            }
          }
        ]
      }
    ]
  },
  {
    header: strings.twoFactorAuth(),
    key: "2fa",
    section: "auth",
    settings: [
      {
        key: "2fa-enabled",
        title: strings.twoFactorAuthEnabled(),
        description: strings.accountIsSecure(),
        keywords: [],
        components: []
      },
      {
        key: "primary-2fa-method",
        title: strings.change2faMethod(),
        keywords: ["primary 2fa method"],
        description: strings.twoFactorAuthDesc(),
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user?.mfa.primaryMethod, listener),
        components: [
          {
            type: "button",
            title: strings.change(),
            action: async () => {
              if (await verifyAccount()) {
                await MultifactorDialog.show({});
                await useUserStore.getState().refreshUser();
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "fallback-2fa-method",
        title: strings.addFallback2faMethod(),
        description: strings.addFallback2faMethodDesc(),
        keywords: ["backup 2fa methods"],
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user?.mfa.secondaryMethod, listener),
        components: () => [
          {
            type: "button",
            title: useUserStore.getState().user?.mfa.secondaryMethod
              ? strings.change2faFallbackMethod()
              : strings.addFallback2faMethod(),
            variant: "secondary",
            action: async () => {
              if (await verifyAccount()) {
                await MultifactorDialog.show({
                  primaryMethod:
                    useUserStore.getState().user?.mfa.primaryMethod || "email"
                });
                await useUserStore.getState().refreshUser();
              }
            }
          }
        ]
      },
      {
        key: "recovery-codes",
        title: strings.viewRecoveryCodes(),
        description: strings.viewRecoveryCodesDesc(),
        keywords: ["recovery codes"],
        components: [
          {
            type: "button",
            title: strings.viewRecoveryCodes(),
            variant: "secondary",
            action: async () => {
              if (await verifyAccount()) {
                await RecoveryCodesDialog.show({
                  primaryMethod:
                    useUserStore.getState().user?.mfa.primaryMethod || "email"
                });
                await useUserStore.getState().refreshUser();
              }
            }
          }
        ]
      }
    ]
  }
];
