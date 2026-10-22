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
import { validators } from "../../../components/ui/input/form-input";
import { db } from "../../../common/database";
import { AppLockPassword } from "../../../components/dialogs/applock-password";
import AppLockTimeout from "../../../components/sheets/app-lock-timeout";
import LockVaultTimer from "../../../components/sheets/lock-vault-timer";
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
      validators: [validators.url()],
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
          id: "vault-group",
          name: strings.vault(),
          type: "group",
          sections: [
            {
              id: "create-vault",
              name: strings.createVault(),
              description: strings.createVaultDesc(),
              icon: "key",
              iconFamily: "notesnook",
              useHook: useVaultStatus,
              hidden: (current) => (current as VaultStatusType)?.exists,
              isModal: true,
              modifer: () => {
                openVault({
                  requestType: VaultRequestType.CreateVault,
                  title: strings.createVault(),
                  buttonTitle: strings.create(),
                  positiveButtonType: "accent"
                });
              }
            },
            {
              id: "biometric-unlock",
              type: "switch",
              name: strings.biometricUnlock(),
              icon: "fingerprint-simple",
              iconFamily: "notesnook",
              useHook: useVaultStatus,
              description: strings.biometricUnlockDesc(),
              hidden: (current) => {
                const _current = current as VaultStatusType;
                return !_current?.exists || !_current?.isBiometryAvailable;
              },
              getter: (current) =>
                (current as VaultStatusType)?.biometryEnrolled,
              modifer: (current) => {
                const _current = current as VaultStatusType;
                const isRevoking = _current.biometryEnrolled;
                openVault({
                  requestType: isRevoking
                    ? VaultRequestType.RevokeFingerprint
                    : VaultRequestType.EnableFingerprint,
                  title: isRevoking
                    ? strings.revokeBiometricUnlock()
                    : strings.enableBiometricUnlock(),
                  buttonTitle: isRevoking ? strings.revoke() : strings.enable(),
                  positiveButtonType: "accent"
                });
              }
            },
            {
              id: "change-vault-password",
              useHook: useVaultStatus,
              name: strings.changeVaultPassword(),
              icon: "pencil-simple",
              iconFamily: "notesnook",
              description: strings.changeVaultPasswordDesc(),
              hidden: (current) => !(current as VaultStatusType)?.exists,
              isModal: true,
              modifer: () =>
                openVault({
                  requestType: VaultRequestType.ChangePassword,
                  title: strings.changeVaultPassword(),
                  buttonTitle: strings.change(),
                  positiveButtonType: "accent"
                })
            },
            {
              id: "lock-vault-after",
              useHook: useVaultStatus,
              name: strings.lockVaultAfter(),
              description: strings.lockVaultAfterDesc(),
              hidden: (current) => !(current as VaultStatusType)?.exists,
              icon: "clock",
              iconFamily: "notesnook",
              isModal: true,
              modifer: () => {
                LockVaultTimer.present();
              }
            },
            {
              id: "clear-vault",
              useHook: useVaultStatus,
              description: strings.clearVaultDesc(),
              name: strings.clearVault(),
              icon: "paint-brush-household",
              iconFamily: "notesnook",
              hidden: (current) => !(current as VaultStatusType)?.exists,
              isModal: true,
              modifer: () => {
                openVault({
                  requestType: VaultRequestType.ClearVault,
                  title: strings.clearVault() + "?",
                  buttonTitle: strings.clear(),
                  positiveButtonType: "accent",
                  icon: "warning-circle"
                });
              }
            },
            {
              id: "delete-vault",
              name: strings.deleteVault(),
              description: strings.deleteVaultDesc(),
              icon: "trash",
              iconFamily: "notesnook",
              type: "danger",
              useHook: useVaultStatus,
              hidden: (current) => !(current as VaultStatusType)?.exists,
              isModal: true,
              modifer: () => {
                openVault({
                  requestType: VaultRequestType.DeleteVault,
                  title: strings.deleteVault() + "?",
                  buttonTitle: strings.delete(),
                  positiveButtonType: "accent",
                  icon: "warning-circle"
                });
              }
            }
          ]
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
          id: "app-lock-group",
          type: "group",
          name: strings.appLock(),
          sections: [
            {
              id: "app-lock-mode",
              name: strings.enableAppLock(),
              description: strings.appLockDesc(),
              icon: "lock",
              iconFamily: "notesnook",
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
                const verified = (await verifyUserWithApplock()) as boolean;
                if (!verified) return false;

                if (!SettingsService.getProperty("appLockEnabled")) {
                  if (
                    !SettingsService.getProperty(
                      "appLockHasPasswordSecurity"
                    ) &&
                    (await BiometricService.isBiometryAvailable())
                  ) {
                    SettingsService.setProperty("biometricsAuthEnabled", true);
                  }

                  if (
                    !(await BiometricService.isBiometryAvailable()) &&
                    !SettingsService.getProperty("appLockHasPasswordSecurity")
                  ) {
                    AppLockPassword.present("create", true);
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
              icon: "clock",
              iconFamily: "notesnook",
              isModal: true,
              modifer: async () => {
                if (await verifyUserWithApplock()) {
                  AppLockTimeout.present();
                }
              }
            },
            {
              id: "app-lock-pass-setup",
              icon: "numpad",
              iconFamily: "notesnook",
              name: strings.setupAppLockPassword(),
              description: strings.setupAppLockPasswordDesc(),
              hidden: () => {
                return !!SettingsService.getProperty(
                  "appLockHasPasswordSecurity"
                );
              },
              onVerify: () => {
                return verifyUserWithApplock();
              },
              property: "appLockHasPasswordSecurity",
              isModal: true,
              modifer: () => {
                AppLockPassword.present("create");
              }
            },
            {
              id: "app-lock-pass-change",
              icon: "numpad",
              iconFamily: "notesnook",
              name: strings.changeAppLockPassword(),
              description: strings.changeAppLockPasswordDesc(),
              hidden: () => {
                return !SettingsService.getProperty(
                  "appLockHasPasswordSecurity"
                );
              },
              property: "appLockHasPasswordSecurity",
              isModal: true,
              modifer: () => {
                AppLockPassword.present("change");
              }
            },
            {
              id: "app-lock-pass-remove",
              name: strings.removeAppLockPassword(),
              description: strings.removeAppLockPasswordDesc(),
              hidden: () => {
                return !SettingsService.getProperty(
                  "appLockHasPasswordSecurity"
                );
              },
              icon: "backspace",
              iconFamily: "notesnook",
              property: "appLockHasPasswordSecurity",
              isModal: true,
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
                  if (
                    !SettingsService.getProperty("appLockHasPasswordSecurity")
                  ) {
                    SettingsService.setProperty("appLockEnabled", false);
                    ToastManager.show({
                      heading: strings.appLockDisabled(),
                      type: "success"
                    });
                  }
                }

                return verified;
              },
              icon: "fingerprint-simple",
              iconFamily: "notesnook"
            }
          ]
        }
      ]
    }
  ]
};
