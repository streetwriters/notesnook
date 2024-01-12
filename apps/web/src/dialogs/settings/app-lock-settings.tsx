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
import { useStore as useUserStore } from "../../stores/user-store";
import {
  showPasswordDialog,
  showPromptDialog
} from "../../common/dialog-controller";
import { KeyChain } from "../../interfaces/key-store";
import { showToast } from "../../utils/toast";
import { WebAuthn } from "../../utils/webauthn";
import { generatePassword } from "../../utils/password-generator";

export const AppLockSettings: SettingsGroup[] = [
  {
    key: "vault",
    section: "app-lock",
    header: "App lock",
    settings: [
      {
        key: "enable-app-lock",
        title: "Enable app lock",
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.appLockSettings, listener),
        components: [
          {
            type: "toggle",
            toggle: async () => {
              const isEnabled =
                useSettingStore.getState().appLockSettings.enabled;
              const result = await showPasswordDialog({
                title: "App lock",
                subtitle: `Enter pin or password to ${
                  isEnabled ? "disable" : "enable"
                } app lock.`,
                inputs: {
                  password: {
                    label: "Password",
                    autoComplete: "new-password"
                  }
                },
                async validate({ password }) {
                  if (isEnabled)
                    await KeyChain.unlock(
                      {
                        type: "password",
                        id: "primary",
                        password
                      },
                      { permanent: true }
                    );
                  else
                    await KeyChain.lock({
                      type: "password",
                      id: "primary",
                      password
                    });
                  return true;
                }
              });
              if (result)
                useSettingStore.getState().setAppLockSettings({
                  enabled: !isEnabled
                });
            },
            isToggled: () => useSettingStore.getState().appLockSettings.enabled
          }
        ]
      },
      {
        key: "lock-app-after",
        title: "Lock app after",
        description:
          "How long should the app wait to lock itself after going into the background or going idle?",
        isHidden: () => !useSettingStore.getState().appLockSettings.enabled,
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.appLockSettings, listener),
        components: [
          {
            type: "dropdown",
            options: [
              { title: "Immediately", value: "0" },
              { title: "1 minute", value: "1" },
              { title: "5 minutes", value: "5" },
              { title: "10 minutes", value: "10" },
              { title: "15 minutes", value: "15" },
              { title: "30 minutes", value: "30" },
              { title: "45 minutes", value: "45" },
              { title: "1 hour", value: "60" },
              { title: "Never", value: "-1" }
            ],
            onSelectionChanged: (value) =>
              useSettingStore
                .getState()
                .setAppLockSettings({ lockAfter: parseInt(value) }),
            selectedOption: () =>
              useSettingStore.getState().appLockSettings.lockAfter.toString()
          }
        ]
      },
      {
        key: "password-pin",
        title: "Password/pin",
        description: "The password/pin for unlocking the app.",
        isHidden: () => !useSettingStore.getState().appLockSettings.enabled,
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.appLockSettings, listener),
        components: [
          {
            type: "button",
            title: "Change",
            action: async () => {
              const result = await showPasswordDialog({
                title: "Change app lock password",
                inputs: {
                  oldPassword: {
                    label: "Old password",
                    autoComplete: "current-password"
                  },
                  newPassword: {
                    label: "New password",
                    autoComplete: "new-password"
                  }
                },
                validate({ newPassword, oldPassword }) {
                  return KeyChain.changeCredential(
                    {
                      type: "password",
                      id: "primary",
                      password: oldPassword
                    },
                    {
                      type: "password",
                      id: "primary",
                      password: newPassword
                    }
                  )
                    .then(() => true)
                    .catch(() => false);
                }
              });
              if (result) showToast("success", "App lock password changed!");
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "security-key",
        title: "Use security key",
        description: "Use security key (e.g. YubiKey) for unlocking the app.",
        isHidden: () => !useSettingStore.getState().appLockSettings.enabled,
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.appLockSettings, listener),
        components: () => [
          useSettingStore.getState().appLockSettings.securityKey
            ? {
                type: "button",
                title: "Unregister",
                async action() {
                  await KeyChain.removeCredential({
                    type: "key",
                    id: "securityKey"
                  });
                  useSettingStore
                    .getState()
                    .setAppLockSettings({ securityKey: undefined });
                },
                variant: "secondary"
              }
            : {
                type: "button",
                title: "Register",
                action: async () => {
                  const user = useUserStore.getState().user;
                  const username =
                    user?.email ||
                    (await showPromptDialog({
                      title: "Enter your username",
                      description:
                        "This username will be used to distinguish between different credentials in your security key. Make sure it is unique."
                    }));
                  if (!username)
                    return showToast("error", "Username is required.");

                  const userId = user
                    ? Buffer.from(user.id, "hex")
                    : // fixed id for unregistered users to avoid creating duplicate credentials
                      new Uint8Array([0x61, 0xd1, 0x20, 0x82]);

                  try {
                    const { firstSalt, rawId, transports } =
                      await WebAuthn.registerSecurityKey(userId, username);

                    showToast(
                      "success",
                      "Security key registered. Generating encryption key..."
                    );

                    const label = generatePassword();
                    const { encryptionKey } = await WebAuthn.getEncryptionKey({
                      firstSalt,
                      label,
                      rawId,
                      transports
                    });

                    await KeyChain.lock({
                      type: "key",
                      key: encryptionKey,
                      id: "securityKey"
                    });

                    useSettingStore.getState().setAppLockSettings({
                      securityKey: {
                        firstSalt: Buffer.from(firstSalt).toString("base64"),
                        label,
                        rawId: Buffer.from(rawId).toString("base64"),
                        transports
                      }
                    });

                    showToast(
                      "success",
                      "Security key successfully registered."
                    );
                  } catch (e) {
                    showToast("error", (e as Error).message);
                  }
                },
                variant: "secondary"
              }
        ]
      }
    ]
  }
];
