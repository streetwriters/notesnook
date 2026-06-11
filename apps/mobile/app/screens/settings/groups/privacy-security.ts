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
import { db } from "../../../common/database";
import { AppLockPassword } from "../../../components/dialogs/applock-password";
import {
  VaultStatusType,
  useVaultStatus
} from "../../../hooks/use-vault-status";
import BiometricService from "../../../services/biometrics";
import SettingsService from "../../../services/settings";
import { useUserStore } from "../../../stores/use-user-store";
import {
  ToastManager,
  VaultRequestType,
  openVault
} from "../../../services/event-manager";
import { verifyUserWithApplock } from "../verify-user";
import { SettingSection } from "../types";

export const privacySecurityGroup: SettingSection = {
  id: "privacy-security",
  name: strings.privacyAndSecurity(),
  sections: [
    {
      id: "marketing-emails",
      type: "switch",
      icon: "envelope-simple",
      iconFamily: "notesnook",
      name: strings.marketingEmails(),
      description: strings.marketingEmailsDesc(),
      modifer: async () => {
        try {
          await db.user?.changeMarketingConsent(
            !useUserStore.getState().user?.marketingConsent
          );
          useUserStore.getState().setUser(await db.user?.fetchUser());
        } catch (e) {
          ToastManager.error(e as Error);
        }
      },
      getter: (current: any) => current?.marketingConsent,
      useHook: () => useUserStore((state) => state.user),
      hidden: (current) => !current
    },
    {
      id: "cors-bypass",
      type: "input",
      name: strings.corsBypass(),
      description: strings.corsBypassDesc(),
      inputProperties: {
        defaultValue: "https://cors.notesnook.com",
        autoCorrect: false,
        keyboardType: "url"
      },
      property: "corsProxy",
      icon: "network",
      iconFamily: "notesnook"
    },

    {
      id: "vault",
      type: "screen",
      name: strings.vault(),
      description: strings.vaultDesc(),
      icon: "key",
      iconFamily: "notesnook",
      sections: [
        {
          id: "create-vault",
          name: strings.createVault(),
          description: strings.createVaultDesc(),
          icon: "key",
          useHook: useVaultStatus,
          hidden: (current) => (current as VaultStatusType)?.exists,
          modifer: () => {
            openVault({
              requestType: VaultRequestType.CreateVault,
              title: strings.createVault(),
              buttonTitle: strings.create()
            });
          }
        },
        {
          id: "lock-vault-after",
          type: "component",
          useHook: useVaultStatus,
          name: strings.lockVaultAfter(),
          description: strings.lockVaultAfterDesc(),
          hidden: (current) => !(current as VaultStatusType)?.exists,
          component: "vault-lock-timer",
          icon: "clock-outline"
        },
        {
          id: "change-vault-password",
          useHook: useVaultStatus,
          name: strings.changeVaultPassword(),
          description: strings.changeVaultPasswordDesc(),
          hidden: (current) => !(current as VaultStatusType)?.exists,
          modifer: () =>
            openVault({
              requestType: VaultRequestType.ChangePassword,
              title: strings.changeVaultPassword(),
              buttonTitle: strings.change()
            })
        },
        {
          id: "clear-vault",
          useHook: useVaultStatus,
          description: strings.clearVaultDesc(),
          name: strings.clearVault(),
          hidden: (current) => !(current as VaultStatusType)?.exists,
          modifer: () => {
            openVault({
              requestType: VaultRequestType.ClearVault,
              title: strings.clearVault() + "?",
              buttonTitle: strings.clear(),
              positiveButtonType: "errorShade"
            });
          }
        },
        {
          id: "delete-vault",
          name: strings.deleteVault(),
          description: strings.deleteVaultDesc(),
          useHook: useVaultStatus,
          hidden: (current) => !(current as VaultStatusType)?.exists,
          modifer: () => {
            openVault({
              requestType: VaultRequestType.DeleteVault,
              title: strings.deleteVault() + "?",
              buttonTitle: strings.delete(),
              positiveButtonType: "errorShade"
            });
          }
        },
        {
          id: "biometric-unlock",
          type: "switch",
          name: strings.biometricUnlock(),
          icon: "fingerprint",
          useHook: useVaultStatus,
          description: strings.biometricUnlockDesc(),
          hidden: (current) => {
            const _current = current as VaultStatusType;
            return !_current?.exists || !_current?.isBiometryAvailable;
          },
          getter: (current) => (current as VaultStatusType)?.biometryEnrolled,
          modifer: (current) => {
            const _current = current as VaultStatusType;
            const isRevoking = _current.biometryEnrolled;
            openVault({
              requestType: isRevoking
                ? VaultRequestType.RevokeFingerprint
                : VaultRequestType.EnableFingerprint,
              title: isRevoking
                ? strings.revokeBiometricUnlock()
                : strings.vaultEnableBiometrics(),
              buttonTitle: isRevoking ? strings.revoke() : strings.enable()
            });
          }
        }
      ]
    },
    {
      id: "privacy-mode",
      type: "switch",
      icon: "eye-slash",
      iconFamily: "notesnook",
      name: strings.privacyMode(),
      description: strings.privacyModeDesc(),
      modifer: () => {
        const settings = SettingsService.get();
        SettingsService.setPrivacyScreen(!settings.privacyScreen);
        SettingsService.set({ privacyScreen: !settings.privacyScreen });
      },
      property: "privacyScreen"
    },
    {
      id: "app-lock",
      name: strings.appLock(),
      type: "screen",
      description: strings.appLockDesc(),
      icon: "lock-simple",
      iconFamily: "notesnook",
      featureId: "appLock",
      sections: [
        {
          id: "app-lock-mode",
          name: strings.enableAppLock(),
          description: strings.appLockDesc(),
          icon: "lock",
          type: "switch",
          property: "appLockEnabled",
          featureId: "appLock",
          onChange: (property) => {
            if (property) {
              SettingsService.set({
                privacyScreen: true
              });
              SettingsService.setPrivacyScreen(true);
            }
          },
          onVerify: async () => {
            const verified = await verifyUserWithApplock();
            if (!verified) return false;

            if (!SettingsService.getProperty("appLockEnabled")) {
              if (
                !SettingsService.getProperty("appLockHasPasswordSecurity") &&
                (await BiometricService.isBiometryAvailable())
              ) {
                SettingsService.setProperty("biometricsAuthEnabled", true);
              }

              if (
                !(await BiometricService.isBiometryAvailable()) &&
                !SettingsService.getProperty("appLockHasPasswordSecurity")
              ) {
                ToastManager.show({
                  heading: strings.biometricsNotEnrolled(),
                  type: "error",
                  message: strings.biometricsNotEnrolledDesc()
                });
                return false;
              }
            }

            return verified;
          }
        },
        {
          id: "app-lock-timer",
          name: strings.appLockTimeout(),
          description: strings.appLockTimeoutDesc(),
          type: "component",
          component: "applock-timer"
        },
        {
          id: "app-lock-pin",
          name: () =>
            SettingsService.getProperty("applockKeyboardType") === "numeric"
              ? strings.setupAppLockPin()
              : strings.setupAppLockPassword(),

          description: () =>
            SettingsService.getProperty("applockKeyboardType") === "numeric"
              ? strings.setupAppLockPinDesc()
              : strings.setupAppLockPasswordDesc(),
          hidden: () => {
            return !!SettingsService.getProperty("appLockHasPasswordSecurity");
          },
          onVerify: () => {
            return verifyUserWithApplock();
          },
          property: "appLockHasPasswordSecurity",
          modifer: () => {
            AppLockPassword.present("create");
          }
        },
        {
          id: "app-lock-pin-change",
          name: () =>
            SettingsService.getProperty("applockKeyboardType") === "numeric"
              ? strings.changeAppLockPin()
              : strings.changeAppLockPassword(),
          description: () =>
            SettingsService.getProperty("applockKeyboardType") === "numeric"
              ? strings.changeAppLockPinDesc()
              : strings.changeAppLockPasswordDesc(),
          hidden: () => {
            return !SettingsService.getProperty("appLockHasPasswordSecurity");
          },
          property: "appLockHasPasswordSecurity",
          modifer: () => {
            AppLockPassword.present("change");
          }
        },
        {
          id: "app-lock-pin-remove",
          name: () =>
            SettingsService.getProperty("applockKeyboardType") === "numeric"
              ? strings.removeAppLockPin()
              : strings.removeAppLockPassword(),
          description: () =>
            SettingsService.getProperty("applockKeyboardType") === "numeric"
              ? strings.removeAppLockPinDesc()
              : strings.removeAppLockPasswordDesc(),
          hidden: () => {
            return !SettingsService.getProperty("appLockHasPasswordSecurity");
          },
          property: "appLockHasPasswordSecurity",
          modifer: () => {
            AppLockPassword.present("remove");
          }
        },
        {
          id: "app-lock-fingerprint",
          name: strings.unlockWithBiometrics(),
          description: strings.unlockWithBiometricsDesc(),
          type: "switch",
          property: "biometricsAuthEnabled",
          onVerify: async () => {
            const verified = await verifyUserWithApplock();
            if (!verified) return false;

            if (SettingsService.getProperty("biometricsAuthEnabled")) {
              if (!SettingsService.getProperty("appLockHasPasswordSecurity")) {
                SettingsService.setProperty("appLockEnabled", false);
                ToastManager.show({
                  heading: strings.appLockDisabled(),
                  type: "success"
                });
              }
            }

            return verified;
          },
          icon: "fingerprint"
        }
      ]
    }
  ]
};
