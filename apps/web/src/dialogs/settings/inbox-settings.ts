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
import {
  InboxApiKeyCards,
  InboxApiKeysStatus,
  createInboxApiKey,
  inboxApiKeysStore
} from "./components/inbox-api-keys";
import { InboxPGPKeysDialog } from "../inbox-pgp-keys-dialog";
import { db } from "../../common/db";
import { confirmAccountPassword } from "../password-dialog";
import { strings } from "@notesnook/intl";
import { InboxHistoryDialog } from "../inbox-history-dialog";
import {
  CheckIcon,
  KeyIcon,
  TrayArrowDown,
  XSquare
} from "../../components/icons";

const isInboxEnabled = () => useSettingStore.getState().isInboxEnabled;
const subscribeToInboxState = (
  listener: (state: unknown, prevState: unknown) => void
) => {
  const unsubscribeSettings = useSettingStore.subscribe(
    (s) => s.isInboxEnabled,
    listener
  );
  const unsubscribeKeys = inboxApiKeysStore.subscribe((state) =>
    listener(state, undefined)
  );
  return () => {
    unsubscribeSettings();
    unsubscribeKeys();
  };
};

export const InboxSettings: SettingsGroup[] = [
  {
    key: "inbox",
    section: "inbox",
    get header() {
      return strings.inbox();
    },
    settings: [
      {
        key: "toggle-inbox",
        icon: CheckIcon,
        get title() {
          return strings.enableInboxAPI();
        },
        get description() {
          return strings.enableInboxAPIDesc();
        },
        keywords: ["inbox"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.isInboxEnabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().isInboxEnabled,
            toggle: async () => {
              await useSettingStore.getState().toggleInbox();
              if (isInboxEnabled()) inboxApiKeysStore.refresh(true);
            }
          }
        ]
      },
      {
        key: "show-inbox-pgp-keys",
        icon: TrayArrowDown,
        get title() {
          return strings.manageInboxKeys();
        },
        get description() {
          return strings.manageInboxKeysDesc();
        },
        keywords: ["inbox", "pgp", "keys"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.isInboxEnabled, listener),
        isHidden: () => !isInboxEnabled(),
        components: [
          {
            type: "navigation",
            action: async () => {
              const ok = await confirmAccountPassword(
                strings.authenticateToViewEditInboxPgpKeys()
              );
              if (!ok) return;

              InboxPGPKeysDialog.show({
                keys: await db.user.getInboxKeys()
              });
            }
          }
        ]
      },
      {
        key: "failed-inbox-items",
        icon: XSquare,
        get title() {
          return strings.failedInboxItems();
        },
        get description() {
          return strings.failedInboxItemsDesc();
        },
        keywords: ["inbox", "failed", "items"],
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.isInboxEnabled, listener),
        isHidden: () => !isInboxEnabled(),
        components: [
          {
            type: "navigation",
            action: () => {
              InboxHistoryDialog.show({});
            }
          }
        ]
      }
    ]
  },
  {
    key: "inbox-api-keys-group",
    section: "inbox",
    get header() {
      return strings.viewAPIKeys();
    },
    isHidden: () => !isInboxEnabled(),
    onRender: () => {
      if (isInboxEnabled()) inboxApiKeysStore.refresh(true);
    },
    onStateChange: subscribeToInboxState,
    settings: [
      {
        key: "inbox-api-keys",
        icon: KeyIcon,
        get title() {
          return strings.viewAPIKeys();
        },
        get description() {
          return strings.createApiKeyDesc();
        },
        keywords: ["inbox", "api", "keys"],
        onStateChange: subscribeToInboxState,
        isHidden: () =>
          !isInboxEnabled() ||
          inboxApiKeysStore.getState().status !== "fulfilled" ||
          inboxApiKeysStore.getKeys().length === 0,
        components: [
          {
            type: "navigation",
            action: () => createInboxApiKey()
          }
        ]
      },
      {
        key: "inbox-api-keys-status",
        title: "",
        onStateChange: subscribeToInboxState,
        isHidden: () =>
          !isInboxEnabled() ||
          (inboxApiKeysStore.getState().status === "fulfilled" &&
            inboxApiKeysStore.getKeys().length > 0),
        components: [
          {
            type: "custom",
            component: InboxApiKeysStatus
          }
        ]
      }
    ]
  },
  {
    key: "inbox-api-key-cards",
    section: "inbox",
    header: InboxApiKeyCards,
    settings: [],
    isHidden: () => !isInboxEnabled(),
    onStateChange: (listener) =>
      useSettingStore.subscribe((s) => s.isInboxEnabled, listener)
  }
];
