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
import { useStore as useSettingStore } from "../../stores/setting-store";
import { InboxApiKeys } from "./components/inbox-api-keys";
import { InboxPGPKeysDialog } from "../inbox-pgp-keys-dialog";
import { db } from "../../common/db";
import { showPasswordDialog } from "../password-dialog";
import { strings } from "@notesnook/intl";

export const InboxSettings: SettingsGroup[] = [
  {
    key: "inbox",
    section: "inbox",
    header: "Inbox",
    settings: [
      {
        key: "toggle-inbox",
        title: "Enable Inbox API",
        description: "Enable/disable Inbox API",
        keywords: ["inbox"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.isInboxEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().isInboxEnabled,
            toggle: () => useSettingStore.getState().toggleInbox()
          }
        ]
      },
      {
        key: "show-inbox-pgp-keys",
        title: "Inbox PGP Keys",
        description: "View/edit your Inbox PGP keys",
        keywords: ["inbox", "pgp", "keys"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.isInboxEnabled, listener),
        isHidden: () => !useSettingStore.getState().isInboxEnabled,
        components: [
          {
            type: "button",
            title: "Show",
            variant: "secondary",
            action: async () => {
              const ok = await showPasswordDialog({
                title: "Authenticate to view/edit Inbox PGP keys",
                inputs: {
                  password: {
                    label: strings.accountPassword(),
                    autoComplete: "current-password"
                  }
                },
                validate: ({ password }) => {
                  return db.user.verifyPassword(password);
                }
              });
              if (!ok) return;

              InboxPGPKeysDialog.show({
                keys: await db.user.getInboxKeys()
              });
            }
          }
        ]
      },
      {
        key: "inbox-api-keys",
        title: "",
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.isInboxEnabled, listener),
        isHidden: () => !useSettingStore.getState().isInboxEnabled,
        components: [
          {
            type: "custom",
            component: InboxApiKeys
          }
        ]
      }
    ]
  }
];
