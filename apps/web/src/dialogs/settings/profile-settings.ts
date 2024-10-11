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

import { strings } from "@notesnook/intl";
import { createBackup, verifyAccount } from "../../common";
import { db } from "../../common/db";
import { TaskManager } from "../../common/task-manager";
import { showPasswordDialog } from "../../dialogs/password-dialog";
import { useStore as useUserStore } from "../../stores/user-store";
import { logger } from "../../utils/logger";
import { showToast } from "../../utils/toast";
import { AttachmentsDialog } from "../attachments-dialog";
import {
  ConfirmDialog,
  showClearSessionsConfirmation,
  showLogoutConfirmation
} from "../confirm";
import { EmailChangeDialog } from "../email-change-dialog";
import { RecoveryKeyDialog } from "../recovery-key-dialog";
import { UserProfile } from "./components/user-profile";
import { SettingsGroup } from "./types";

export const ProfileSettings: SettingsGroup[] = [
  {
    key: "user-profile",
    section: "profile",
    header: UserProfile,
    onStateChange(listener) {
      return useUserStore.subscribe((s) => s.isLoggedIn, listener);
    },
    settings: [
      {
        key: "email",
        title: strings.changeEmail(),
        description: strings.changeEmailDesc(),
        keywords: [strings.changeEmail(), strings.newEmail()],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "button",
            title: strings.changeEmail(),
            variant: "secondary",
            action: () => EmailChangeDialog.show({})
          }
        ]
      },
      {
        key: "manage-attachments",
        title: strings.attachments(),
        description: strings.manageAttachments(),
        components: [
          {
            type: "button",
            title: strings.open(),
            variant: "secondary",
            action: () => AttachmentsDialog.show({})
          }
        ]
      },
      {
        key: "recovery-key",
        title: strings.saveDataRecoveryKey(),
        description: strings.saveDataRecoveryKeyDesc(),
        keywords: ["data recovery", "lost your password", "backup"],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "button",
            title: strings.save(),
            variant: "secondary",
            action: async () => {
              if (await verifyAccount()) await RecoveryKeyDialog.show({});
            }
          }
        ]
      },
      {
        key: "account-removal",
        title: strings.deleteAccount(),
        description: strings.deleteAccountDesc(),
        keywords: [strings.deleteAccount(), strings.clear()],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "button",
            variant: "error",
            title: strings.deleteAccount(),
            action: () =>
              showPasswordDialog({
                title: strings.deleteAccount(),
                message: strings.deleteAccountDesc(),
                inputs: {
                  password: {
                    label: strings.password(),
                    autoComplete: "current-password"
                  }
                },
                validate: async ({ password }) => {
                  await db.user.deleteUser(password);
                  return true;
                }
              })
          }
        ]
      }
    ]
  },

  {
    key: "user-sessions",
    section: "profile",
    header: strings.sessions(),
    onStateChange(listener) {
      return useUserStore.subscribe((s) => s.isLoggedIn, listener);
    },
    isHidden: () => !useUserStore.getState().isLoggedIn,
    settings: [
      {
        key: "logout",
        title: strings.logout(),
        description: strings.logoutDesc(),
        keywords: [],
        components: [
          {
            type: "button",
            variant: "errorSecondary",
            title: strings.logout(),
            action: async () => {
              const result = await showLogoutConfirmation();
              if (!result) return;

              if (result.backup) {
                try {
                  await createBackup({ mode: "partial" });
                } catch (e) {
                  logger.error(e, "Failed to take backup before logout");
                  if (
                    !(await ConfirmDialog.show({
                      title: strings.failedToTakeBackup(),
                      message: strings.failedToTakeBackupMessage(),
                      negativeButtonText: strings.no(),
                      positiveButtonText: strings.yes()
                    }))
                  )
                    return;
                }
              }

              await TaskManager.startTask({
                type: "modal",
                title: strings.loggingOut(),
                subtitle: strings.pleaseWait(),
                action: () => db.user.logout(true)
              });
              showToast("success", strings.loggedOut());
            }
          }
        ]
      },
      {
        key: "logout-all-sessions",
        title: strings.logoutAllOtherDevices(),
        description: strings.logoutAllOtherDevicesDescription(),
        keywords: [strings.clearSessions()],
        components: [
          {
            type: "button",
            variant: "errorSecondary",
            title: strings.logoutAllOtherDevices(),
            action: async () => {
              if (!(await showClearSessionsConfirmation())) return;

              await db.user.clearSessions();
              showToast("success", strings.loggedOutAllOtherDevices());
            }
          }
        ]
      }
    ]
  }
];
