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
import { logout, verifyAccount } from "../../common";
import { db } from "../../common/db";
import { showPasswordDialog } from "../../dialogs/password-dialog";
import { useStore as useUserStore } from "../../stores/user-store";
import { showToast } from "../../utils/toast";
import { AttachmentsDialog } from "../attachments-dialog";
import { ConfirmDialog, showClearSessionsConfirmation } from "../confirm";
import { EmailChangeDialog } from "../email-change-dialog";
import { RecoveryKeyDialog } from "../recovery-key-dialog";
import { UserProfile } from "./components/user-profile";
import {
  Email,
  KeyIcon,
  PaperclipHorizontal,
  SignOut,
  TrashSimple
} from "../../components/icons";
import { SettingsGroup } from "./types";
import Config from "../../utils/config";

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
        icon: Email,
        title: strings.changeEmail(),
        description: strings.changeEmailDesc(),
        keywords: [strings.changeEmail(), strings.newEmail()],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "navigation",
            action: () => EmailChangeDialog.show({})
          }
        ]
      },
      {
        key: "manage-attachments",
        icon: PaperclipHorizontal,
        title: strings.attachments(),
        description: strings.manageAttachments(),
        components: [
          {
            type: "navigation",
            action: () => AttachmentsDialog.show({})
          }
        ]
      },
      {
        key: "recovery-key",
        icon: KeyIcon,
        title: strings.saveDataRecoveryKey(),
        description: strings.saveDataRecoveryKeyDesc(),
        keywords: ["data recovery", "lost your password", "backup"],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "navigation",
            action: async () => {
              if (await verifyAccount()) await RecoveryKeyDialog.show({});
            }
          }
        ]
      },
      {
        key: "delete-data-for-not-logged-in-user",
        icon: TrashSimple,
        title: strings.deleteData(),
        description: strings.deleteAccountDesc(),
        keywords: [
          strings.deleteData(),
          strings.deleteAccount(),
          strings.clear()
        ],
        isHidden: () => Boolean(useUserStore.getState().isLoggedIn),
        components: [
          {
            type: "navigation",
            action: async () => {
              const ok = await ConfirmDialog.show({
                title: strings.deleteData(),
                subtitle: strings.deleteAccountDesc(),
                positiveButtonText: strings.yes(),
                negativeButtonText: strings.no()
              });
              if (ok) {
                Config.clear();
                await db.reset();
                window.location.reload();
              }
            }
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
        icon: SignOut,
        title: strings.logout(),
        description: strings.logoutDesc(),
        keywords: [],
        components: [
          {
            type: "navigation",
            action: () => logout()
          }
        ]
      },
      {
        key: "logout-all-sessions",
        icon: SignOut,
        title: strings.logoutAllOtherDevices(),
        description: strings.logoutAllOtherDevicesDescription(),
        keywords: [strings.clearSessions()],
        components: [
          {
            type: "navigation",
            action: async () => {
              if (!(await showClearSessionsConfirmation())) return;

              await db.user.clearSessions();
              showToast("success", strings.loggedOutAllOtherDevices());
            }
          }
        ]
      },
      {
        key: "account-removal",
        icon: TrashSimple,
        title: strings.deleteAccount(),
        description: strings.deleteAccountDesc(),
        keywords: [strings.deleteAccount(), strings.clear()],
        isHidden: () => !useUserStore.getState().isLoggedIn,
        components: [
          {
            type: "navigation",
            action: () =>
              showPasswordDialog({
                title: strings.deleteAccount(),
                subtitle: strings.deleteAccountDesc(),
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
  }
];
