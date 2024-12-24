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

import { formatBytes } from "@notesnook/common";
import { User } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import notifee from "@notifee/react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import dayjs from "dayjs";
import React from "react";
import { Appearance, Linking, Platform } from "react-native";
import { getVersion } from "react-native-device-info";
import * as RNIap from "react-native-iap";
import { enabled } from "react-native-privacy-snapshot";
import ScreenGuardModule from "react-native-screenguard";
import { DatabaseLogger, db } from "../../common/database";
import filesystem from "../../common/filesystem";
import { ChangePassword } from "../../components/auth/change-password";
import { presentDialog } from "../../components/dialog/functions";
import { AppLockPassword } from "../../components/dialogs/applock-password";
import {
  endProgress,
  startProgress,
  updateProgress
} from "../../components/dialogs/progress";
import { ChangeEmail } from "../../components/sheets/change-email";
import ExportNotesSheet from "../../components/sheets/export-notes";
import { Issue } from "../../components/sheets/github/issue";
import { Progress } from "../../components/sheets/progress";
import { Update } from "../../components/sheets/update";
import { VaultStatusType, useVaultStatus } from "../../hooks/use-vault-status";
import { BackgroundSync } from "../../services/background-sync";
import BackupService from "../../services/backup";
import BiometricService from "../../services/biometrics";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  openVault,
  presentSheet
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import Notifications from "../../services/notifications";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import Sync from "../../services/sync";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { SUBSCRIPTION_STATUS } from "../../utils/constants";
import {
  eCloseSheet,
  eCloseSimpleDialog,
  eOpenRecoveryKeyDialog
} from "../../utils/events";
import { NotesnookModule } from "../../utils/notesnook-module";
import { sleep } from "../../utils/time";
import { MFARecoveryCodes, MFASheet } from "./2fa";
import { useDragState } from "./editor/state";
import { verifyUser, verifyUserWithApplock } from "./functions";
import { SettingSection } from "./types";
import { getTimeLeft } from "./user-section";

export const settingsGroups: SettingSection[] = [
  {
    id: "account",
    name: strings.account(),
    useHook: () => useUserStore((state) => state.user),
    hidden: (current) => !current,
    sections: [
      {
        id: "subscription-status",
        useHook: () => useUserStore((state) => state.user),
        hidden: (current) => !current,
        name: (current) => {
          const user = current as User;
          const isBasic = user.subscription?.type === SUBSCRIPTION_STATUS.BASIC;
          const isTrial = user.subscription?.type === SUBSCRIPTION_STATUS.TRIAL;
          return isBasic || !user.subscription?.type
            ? strings.subscribeToPro()
            : isTrial
            ? strings.trialStarted()
            : strings.subDetails();
        },
        type: "component",
        component: "subscription",
        icon: "crown",
        description: (current) => {
          const user = current as User;
          const subscriptionDaysLeft =
            user &&
            getTimeLeft(
              parseInt(user.subscription?.expiry as unknown as string)
            );
          const expiryDate = dayjs(user?.subscription?.expiry).format(
            "MMMM D, YYYY"
          );
          const startDate = dayjs(user?.subscription?.start).format(
            "MMMM D, YYYY"
          );

          if (user.subscription.provider === 4) {
            return strings.subEndsOn(expiryDate);
          }

          return user.subscription?.type === 2
            ? strings.signedUpOn(startDate)
            : user.subscription?.type === 1
            ? strings.trialEndsOn(expiryDate)
            : user.subscription?.type === 6
            ? subscriptionDaysLeft.time < -3
              ? strings.subEnded()
              : strings.accountDowngradedIn(3)
            : user.subscription?.type === 7
            ? strings.subEndsOn(expiryDate)
            : user.subscription?.type === 5
            ? strings.subRenewOn(expiryDate)
            : strings.neverHesitate();
        }
      },
      {
        id: "redeem-gift-code",
        name: strings.redeemGiftCode(),
        description: strings.redeemGiftCodeDesc(),
        hidden: (current) => {
          return !current as boolean;
        },
        useHook: () =>
          useUserStore(
            (state) =>
              state.user?.subscription.type == SUBSCRIPTION_STATUS.TRIAL ||
              state.user?.subscription.type == SUBSCRIPTION_STATUS.BASIC
          ),
        icon: "gift",
        modifer: () => {
          presentDialog({
            title: strings.redeemGiftCode(),
            paragraph: strings.redeemGiftCodeDesc(),
            input: true,
            inputPlaceholder: strings.code(),
            positiveText: strings.redeem(),
            positivePress: async (value) => {
              db.subscriptions.redeemCode(value).catch((e) => {
                ToastManager.show({
                  heading: "Error redeeming code",
                  message: (e as Error).message,
                  type: "error"
                });
              });
            }
          });
        }
      },
      {
        id: "account-settings",
        type: "screen",
        name: strings.manageAccount(),
        icon: "account-cog",
        description: strings.manageAccountDesc(),
        sections: [
          {
            id: "remove-profile-picture",
            name: strings.removeProfilePicture(),
            description: strings.removeProfilePictureDesc(),
            useHook: () =>
              useUserStore((state) => state.profile?.profilePicture),
            hidden: () => !useUserStore.getState().profile?.profilePicture,
            modifer: () => {
              presentDialog({
                title: strings.removeProfilePicture(),
                paragraph: strings.removeProfilePictureConfirmation(),
                positiveText: strings.remove(),
                positivePress: async () => {
                  db.settings
                    .setProfile({
                      profilePicture: undefined
                    })
                    .then(async () => {
                      useUserStore.setState({
                        profile: db.settings.getProfile()
                      });
                    });
                }
              });
            }
          },
          {
            id: "remove-name",
            name: strings.removeFullName(),
            description: strings.removeFullNameDesc(),
            useHook: () => useUserStore((state) => state.profile?.fullName),
            hidden: () => !useUserStore.getState().profile?.fullName,
            modifer: () => {
              presentDialog({
                title: strings.removeFullName(),
                paragraph: strings.removeFullNameConfirmation(),
                positiveText: strings.remove(),
                positivePress: async () => {
                  db.settings
                    .setProfile({
                      fullName: undefined
                    })
                    .then(async () => {
                      useUserStore.setState({
                        profile: db.settings.getProfile()
                      });
                    });
                }
              });
            }
          },
          {
            id: "recovery-key",
            name: strings.saveDataRecoveryKey(),
            modifer: async () => {
              verifyUser(null, async () => {
                await sleep(300);
                eSendEvent(eOpenRecoveryKeyDialog);
              });
            },
            description: strings.saveDataRecoveryKeyDesc()
          },
          {
            id: "manage-attachments",
            name: strings.manageAttachments(),
            icon: "attachment",
            type: "screen",
            component: "attachments-manager",
            description: strings.manageAttachmentsDesc(),
            hideHeader: true
          },
          {
            id: "change-password",
            name: strings.changePassword(),
            modifer: async () => {
              ChangePassword.present();
            },
            description: strings.changePasswordDesc()
          },
          {
            id: "change-email",
            name: strings.changeEmail(),
            modifer: async () => {
              ChangeEmail.present();
            },
            description: strings.changeEmailDesc()
          },
          {
            id: "2fa-settings",
            type: "screen",
            name: strings.twoFactorAuth(),
            description: strings.twoFactorAuthDesc(),
            icon: "two-factor-authentication",
            sections: [
              {
                id: "enable-2fa",
                name: strings.change2faMethod(),
                modifer: () => {
                  verifyUser("global", async () => {
                    MFASheet.present();
                  });
                },
                useHook: () => useUserStore((state) => state.user),
                description: strings.change2faMethodDesc()
              },
              {
                id: "2fa-fallback",
                name: strings.addFallback2faMethod(),
                useHook: () => useUserStore((state) => state.user),
                hidden: (user) => {
                  return (
                    !!(user as User)?.mfa?.secondaryMethod ||
                    !(user as User)?.mfa?.isEnabled
                  );
                },
                modifer: () => {
                  verifyUser("global", async () => {
                    MFASheet.present(true);
                  });
                },
                description: strings.addFallback2faMethodDesc()
              },
              {
                id: "change-2fa-method",
                name: strings.change2faFallbackMethod(),
                useHook: () => useUserStore((state) => state.user),
                hidden: (user) => {
                  return (
                    !(user as User)?.mfa?.secondaryMethod ||
                    !(user as User)?.mfa?.isEnabled
                  );
                },
                modifer: () => {
                  verifyUser("global", async () => {
                    MFASheet.present(true);
                  });
                },
                description: strings.change2faFallbackMethod()
              },
              {
                id: "view-2fa-codes",
                name: strings.viewRecoveryCodes(),
                modifer: () => {
                  verifyUser("global", async () => {
                    MFARecoveryCodes.present("sms");
                  });
                },
                useHook: () => useUserStore((state) => state.user),
                hidden: (user) => {
                  return !(user as User)?.mfa?.isEnabled;
                },
                description: strings.viewRecoveryCodesDesc()
              }
            ]
          },
          {
            id: "subscription-not-active",
            name: strings.subscriptionNotActivated(),
            hidden: () => Platform.OS !== "ios",
            modifer: async () => {
              if (Platform.OS === "android") return;
              presentSheet({
                title: strings.loadingSubscription(),
                paragraph: strings.loadingSubscriptionDesc()
              });
              const subscriptions = await RNIap.getPurchaseHistory();
              subscriptions.sort(
                (a, b) => b.transactionDate - a.transactionDate
              );
              const currentSubscription = subscriptions[0];
              presentSheet({
                title: strings.notesnookPro(),
                paragraph: strings.subscribedOnVerify(
                  new Date(currentSubscription.transactionDate).toLocaleString()
                ),
                action: async () => {
                  presentSheet({
                    title: strings.verifySubscription(),
                    paragraph: strings.subscriptionVerifyWait()
                  });
                  await PremiumService.subscriptions.verify(
                    currentSubscription
                  );
                  eSendEvent(eCloseSheet);
                },
                icon: "information-outline",
                actionText: strings.verify()
              });
            },
            description: strings.verifySubDesc()
          },
          {
            id: "clear-cache",
            name: strings.clearCache(),
            icon: "delete",
            modifer: async () => {
              presentDialog({
                title: strings.clearCacheConfirm(),
                paragraph: strings.clearCacheConfirmDesc(),
                positiveText: strings.clear(),
                positivePress: async () => {
                  filesystem.clearCache();
                  ToastManager.show({
                    heading: strings.cacheCleared(),
                    message: strings.cacheClearedDesc(),
                    type: "success"
                  });
                }
              });
            },
            description(current) {
              return strings.clearCacheDesc(current as number);
            },
            useHook: () => {
              const [cacheSize, setCacheSize] = React.useState(0);
              React.useEffect(() => {
                filesystem.getCacheSize().then(setCacheSize).catch(console.log);
                const sub = eSubscribeEvent("cache-cleared", () => {
                  setCacheSize(0);
                });
                return () => {
                  sub?.unsubscribe();
                };
              }, []);
              return formatBytes(cacheSize);
            }
          },

          {
            id: "logout",
            name: strings.logout(),
            description: strings.logoutWarnin(),
            icon: "logout",
            modifer: async () => {
              const hasUnsyncedChanges = await db.hasUnsyncedChanges();
              presentDialog({
                title: strings.logout(),
                paragraph: strings.logoutConfirmation(),
                positiveText: strings.logout(),
                check: {
                  info: strings.backupDataBeforeLogout(),
                  defaultValue: true
                },
                notice: hasUnsyncedChanges
                  ? {
                      text: strings.unsyncedChangesWarning(),
                      type: "alert"
                    }
                  : undefined,
                positivePress: async (_, takeBackup) => {
                  eSendEvent(eCloseSimpleDialog);
                  setTimeout(async () => {
                    try {
                      startProgress({
                        fillBackground: true,
                        title: strings.loggingOut(),
                        canHideProgress: true,
                        paragraph: strings.loggingOutDesc()
                      });

                      Navigation.navigate("Notes");

                      if (takeBackup) {
                        updateProgress({
                          progress: strings.backingUpData()
                        });

                        try {
                          const result = await BackupService.run(
                            false,
                            "local",
                            "partial"
                          );
                          if (result.error) throw result.error as Error;
                        } catch (e) {
                          DatabaseLogger.error(e);
                          const error = e;
                          const canLogout = await new Promise((resolve) => {
                            presentDialog({
                              context: "local",
                              title: strings.failedToTakeBackup(),
                              paragraph: `${
                                (error as Error).message
                              }. ${strings.failedToTakeBackupMessage()}?`,
                              positiveText: strings.yes(),
                              negativeText: strings.no(),
                              positivePress: () => {
                                resolve(true);
                              },
                              onClose: () => {
                                resolve(false);
                              }
                            });
                          });
                          if (!canLogout) {
                            endProgress();
                            return;
                          }
                        }
                      }

                      updateProgress({
                        progress: strings.loggingOut()
                      });

                      await db.user?.logout();
                      endProgress();
                    } catch (e) {
                      DatabaseLogger.error(e);
                      ToastManager.error(e as Error, strings.logoutError());
                      endProgress();
                    }
                  }, 300);
                }
              });
            }
          },
          {
            id: "delete-account",
            type: "danger",
            name: strings.deleteAccount(),
            icon: "alert",
            description: strings.deleteAccountDesc(),
            modifer: () => {
              presentDialog({
                title: strings.deleteAccount(),
                paragraphColor: "red",
                paragraph: strings.deleteAccountDesc(),
                positiveType: "errorShade",
                input: true,
                inputPlaceholder: strings.enterAccountPassword(),
                positiveText: strings.delete(),
                positivePress: async (value) => {
                  try {
                    const verified = await db.user?.verifyPassword(value);
                    if (verified) {
                      setTimeout(async () => {
                        startProgress({
                          title: "Deleting account",
                          paragraph: "Please wait while we delete your account"
                        });
                        Navigation.navigate("Notes");
                        await db.user?.deleteUser(value);
                        await BiometricService.resetCredentials();
                        SettingsService.set({
                          introCompleted: true
                        });
                      }, 300);
                    } else {
                      ToastManager.show({
                        heading: strings.passwordIncorrect(),
                        type: "error",
                        context: "global"
                      });
                    }

                    endProgress();
                  } catch (e) {
                    endProgress();
                    console.log(e);
                    ToastManager.error(
                      e as Error,
                      strings.failedToDeleteAccount(),
                      "global"
                    );
                  }
                }
              });
            }
          }
        ]
      },
      {
        id: "sync-settings",
        name: strings.syncSettings(),
        description: strings.syncSettingsDesc(),
        type: "screen",
        icon: "autorenew",
        component: "offline-mode-progress",
        sections: [
          {
            id: "offline-mode",
            name: strings.fullOfflineMode(),
            description: strings.fullOfflineModeDesc(),
            type: "switch",
            property: "offlineMode",
            modifer: () => {
              const current = SettingsService.get().offlineMode;
              if (current) {
                SettingsService.setProperty("offlineMode", false);
                db.fs().cancel("offline-mode");
                return;
              }
              PremiumService.verify(() => {
                SettingsService.setProperty("offlineMode", true);
                db.attachments.cacheAttachments().catch(console.log);
              });
            }
          },
          {
            id: "auto-sync",
            name: strings.disableAutoSync(),
            description: strings.disableAutoSyncDesc(),
            type: "switch",
            property: "disableAutoSync"
          },
          {
            id: "disable-realtime-sync",
            name: strings.disableRealtimeSync(),
            description: strings.disableRealtimeSyncDesc(),
            type: "switch",
            property: "disableRealtimeSync"
          },
          {
            id: "disable-sync",
            name: strings.disableSync(),
            description: strings.disableSyncDesc(),
            type: "switch",
            property: "disableSync"
          },
          {
            id: "background-sync",
            name: strings.backgroundSync(),
            description: strings.backgroundSyncDesc(),
            type: "switch",
            property: "backgroundSync",
            onChange: (value) => {
              if (value) {
                BackgroundSync.start();
              } else {
                BackgroundSync.stop();
              }
            }
          },
          {
            id: "pull-sync",
            name: strings.forcePullChanges(),
            description: strings.forcePullChangesDesc(),
            modifer: () => {
              presentDialog({
                title: strings.forcePullChanges(),
                paragraph: strings.forceSyncNotice(),
                negativeText: strings.cancel(),
                positiveText: strings.start(),
                positivePress: async () => {
                  eSendEvent(eCloseSheet);
                  await sleep(300);
                  Progress.present();
                  Sync.run("global", true, "fetch", () => {
                    eSendEvent(eCloseSheet);
                  });
                }
              });
            }
          },
          {
            id: "push-sync",
            name: strings.forcePushChanges(),
            description: strings.forcePushChangesDesc(),
            modifer: () => {
              presentDialog({
                title: strings.forcePushChanges(),
                paragraph: strings.forceSyncNotice(),
                negativeText: strings.cancel(),
                positiveText: strings.start(),
                positivePress: async () => {
                  eSendEvent(eCloseSheet);
                  await sleep(300);
                  Progress.present();
                  Sync.run("global", true, "send", () => {
                    eSendEvent(eCloseSheet);
                  });
                }
              });
            }
          }
        ]
      }
    ]
  },
  {
    id: "customize",
    name: strings.customization(),
    sections: [
      {
        id: "personalization",
        type: "screen",
        name: strings.appearance(),
        description: strings.appearanceDesc(),
        icon: "shape",
        sections: [
          {
            id: "theme-picker",
            type: "screen",
            name: strings.themes(),
            description: strings.themesDesc(),
            component: "theme-selector"
          },
          {
            id: "use-system-theme",
            type: "switch",
            name: strings.useSystemTheme(),
            description: strings.useSystemThemeDesc(),
            property: "useSystemTheme",
            icon: "circle-half",
            modifer: () => {
              const current = SettingsService.get().useSystemTheme;
              SettingsService.set({
                useSystemTheme: !current
              });
              if (!current) {
                useThemeStore
                  .getState()
                  .setColorScheme(Appearance.getColorScheme() as any);
              }
            }
          },
          {
            id: "enable-dark-mode",
            type: "switch",
            name: strings.darkMode(),
            description: strings.darkModeDesc(),
            property: "colorScheme",
            icon: "brightness-6",
            modifer: () => {
              useThemeStore.getState().setColorScheme();
            },
            getter: () => useThemeStore.getState().colorScheme === "dark"
          }
        ]
      },
      {
        id: "behaviour",
        type: "screen",
        name: strings.behavior(),
        description: strings.behaviorDesc(),
        sections: [
          {
            id: "default-home",
            type: "component",
            name: strings.homepage(),
            description: strings.homepageDesc(),
            component: "homeselector"
          },
          {
            id: "date-format",
            name: strings.dateFormat(),
            description: strings.dateFormatDesc(),
            type: "component",
            component: "date-format-selector"
          },
          {
            id: "time-format",
            name: strings.timeFormat(),
            description: strings.timeFormatDesc(),
            type: "component",
            component: "time-format-selector"
          },
          {
            id: "clear-trash-interval",
            type: "component",
            name: strings.clearTrashInterval(),
            description: strings.clearTrashIntervalDesc(),
            component: "trash-interval-selector"
          },
          {
            id: "default-notebook",
            name: strings.clearDefaultNotebook(),
            description: strings.clearDefaultNotebookDesc(),
            modifer: () => {
              db.settings.setDefaultNotebook(undefined);
            },
            hidden: () => !db.settings.getDefaultNotebook()
          }
        ]
      },
      {
        id: "editor",
        name: strings.editor(),
        type: "screen",
        icon: "note-edit-outline",
        description: strings.editorDesc(),
        sections: [
          {
            id: "configure-toolbar",
            type: "screen",
            name: strings.customizeToolbar(),
            description: strings.customizeToolbarDesc(),
            component: "configuretoolbar"
          },
          {
            id: "reset-toolbar",
            name: strings.resetToolbar(),
            description: strings.resetToolbarDesc(),
            modifer: () => {
              useDragState.getState().setPreset("default");
            }
          },
          {
            id: "double-spaced-lines",
            name: strings.doubleSpacedLines(),
            description: strings.doubleSpacedLinesDesc(),
            type: "switch",
            property: "doubleSpacedLines",
            icon: "format-line-spacing",
            onChange: () => {
              ToastManager.show({
                heading: strings.lineSpacingChanged(),
                type: "success"
              });
            }
          },
          {
            id: "default-font-size",
            name: strings.defaultFontSize(),
            description: strings.defaultFontSizeDesc(),
            type: "input-selector",
            minInputValue: 8,
            maxInputValue: 120,
            icon: "format-size",
            property: "defaultFontSize"
          },
          {
            id: "default-font-family",
            name: strings.defaultFontFamily(),
            description: strings.defaultFontFamilyDesc(),
            type: "component",
            icon: "format-font",
            property: "defaultFontFamily",
            component: "font-selector"
          },
          {
            id: "title-format",
            name: strings.titleFormat(),
            component: "title-format",
            description: strings.titleFormatDesc(),
            type: "component"
          },
          {
            id: "toggle-markdown",
            name: strings.mardownShortcuts(),
            property: "markdownShortcuts",
            description: strings.mardownShortcutsDesc(),
            type: "switch"
          }
        ]
      },
      {
        id: "servers",
        type: "screen",
        name: strings.servers(),
        description: strings.serversConfigurationDesc(),
        icon: "server",
        component: "server-config"
      }
    ]
  },
  {
    id: "privacy-security",
    name: strings.privacyAndSecurity(),
    sections: [
      {
        id: "marketing-emails",
        type: "switch",
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
        icon: "arrow-decision-outline"
      },

      {
        id: "vault",
        type: "screen",
        name: strings.vault(),
        description: strings.vaultDesc(),
        icon: "key",
        sections: [
          {
            id: "create-vault",
            name: strings.createVault(),
            description: strings.createVaultDesc(),
            icon: "key",
            useHook: useVaultStatus,
            hidden: (current) => (current as VaultStatusType)?.exists,
            modifer: () => {
              PremiumService.verify(() => {
                openVault({
                  item: {},
                  novault: false,
                  title: strings.createVault()
                });
              });
            }
          },
          {
            id: "change-vault-password",
            useHook: useVaultStatus,
            name: strings.changeVaultPassword(),
            description: strings.changeVaultPasswordDesc(),
            hidden: (current) => !(current as VaultStatusType)?.exists,
            modifer: () =>
              openVault({
                item: {},
                changePassword: true,
                novault: true,
                title: strings.changeVaultPassword()
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
                item: {},
                clearVault: true,
                novault: true,
                title: strings.clearVault() + "?"
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
                item: {},
                deleteVault: true,
                novault: true,
                title: strings.deleteVault() + "?"
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
              openVault({
                item: {},
                fingerprintAccess: !_current.biometryEnrolled,
                revokeFingerprintAccess: _current.biometryEnrolled,
                novault: true,
                title: _current.biometryEnrolled
                  ? strings.revokeBiometricUnlock()
                  : strings.vaultEnableBiometrics()
              });
            }
          }
        ]
      },
      {
        id: "privacy-mode",
        type: "switch",
        icon: "eye-off-outline",
        name: strings.privacyMode(),
        description: strings.privacyModeDesc(),
        modifer: () => {
          const settings = SettingsService.get();
          if (Platform.OS === "ios") {
            enabled(!settings.privacyScreen);
            if (settings.privacyScreen) {
              ScreenGuardModule.unregister();
            } else {
              ScreenGuardModule.register({
                backgroundColor: "#000000"
              });
            }
          } else {
            NotesnookModule.setSecureMode(!settings.privacyScreen);
          }

          SettingsService.set({ privacyScreen: !settings.privacyScreen });
        },
        property: "privacyScreen"
      },
      {
        id: "app-lock",
        name: strings.appLock(),
        type: "screen",
        description: strings.appLockDesc(),
        icon: "lock",
        sections: [
          {
            id: "app-lock-mode",
            name: strings.enableAppLock(),
            description: strings.appLockDesc(),
            icon: "lock",
            type: "switch",
            property: "appLockEnabled",
            onChange: () => {
              SettingsService.set({
                privacyScreen: true
              });
              SettingsService.setPrivacyScreen(SettingsService.get());
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
              return !!SettingsService.getProperty(
                "appLockHasPasswordSecurity"
              );
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
            icon: "fingerprint"
          }
        ]
      }
    ]
  },
  {
    id: "back-restore",
    name: strings.backupRestore(),
    sections: [
      {
        id: "backups",
        type: "screen",
        name: strings.backups(),
        icon: "backup-restore",
        description: strings.backupsDesc(),
        sections: [
          {
            id: "backup-now",
            name: strings.backupNow(),
            description: strings.backupNowDesc(),
            modifer: async () => {
              const user = useUserStore.getState().user;
              if (!user || SettingsService.getProperty("encryptedBackup")) {
                await BackupService.run(true);
                return;
              }

              verifyUser(null, () => BackupService.run(true));
            }
          },
          {
            id: "backup-now",
            name: strings.backupNowWithAttachments(),
            description: strings.backupNowWithAttachmentsDesc(),
            hidden: () => !useUserStore.getState().user,
            modifer: async () => {
              const user = useUserStore.getState().user;
              if (!user || SettingsService.getProperty("encryptedBackup")) {
                await BackupService.run(true, undefined, "full");
                return;
              }

              verifyUser(null, () =>
                BackupService.run(true, undefined, "full")
              );
            }
          },
          {
            id: "auto-backups",
            type: "component",
            name: strings.automaticBackups(),
            description: strings.automaticBackupsDesc(),
            component: "autobackups"
          },
          {
            id: "auto-backups-with-attachments",
            type: "component",
            hidden: () => !useUserStore.getState().user,
            name: strings.automaticBackupsWithAttachments(),
            description: [
              ...strings.automaticBackupsWithAttachmentsDesc()
            ].join("\n"),
            component: "autobackupsattachments"
          },
          {
            id: "select-backup-dir",
            name: strings.selectBackupDir(),
            description: () => {
              const desc = strings.selectBackupDirDesc(
                SettingsService.get().backupDirectoryAndroid?.path || ""
              );
              return desc[0] + " " + desc[1];
            },
            icon: "folder",
            hidden: () =>
              !!SettingsService.get().backupDirectoryAndroid ||
              Platform.OS !== "android",
            property: "backupDirectoryAndroid",
            modifer: async () => {
              let dir;
              try {
                dir = await BackupService.checkBackupDirExists(true);
              } catch (e) {
                console.error(e);
              } finally {
                if (!dir) {
                  ToastManager.show({
                    heading: strings.noDirectorySelected(),
                    type: "error"
                  });
                }
              }
            }
          },
          {
            id: "change-backup-dir",
            name: strings.changeBackupDir(),
            description: () =>
              SettingsService.get().backupDirectoryAndroid?.name || "",
            icon: "folder",
            hidden: () =>
              !SettingsService.get().backupDirectoryAndroid ||
              Platform.OS !== "android",
            property: "backupDirectoryAndroid",
            modifer: async () => {
              let dir;
              try {
                dir = await BackupService.checkBackupDirExists(true);
              } catch (e) {
                console.error(e);
              } finally {
                if (!dir) {
                  ToastManager.show({
                    heading: strings.noDirectorySelected(),
                    type: "error"
                  });
                }
              }
            }
          },
          {
            id: "enable-backup-encryption",
            type: "switch",
            name: strings.backupEncryption(),
            description: strings.backupEncryptionDesc(),
            icon: "lock",
            property: "encryptedBackup",
            modifer: async () => {
              const user = useUserStore.getState().user;
              const settings = SettingsService.get();
              if (!user) {
                ToastManager.show({
                  heading: strings.loginRequired(),
                  type: "error"
                });
                return;
              }
              if (settings.encryptedBackup) {
                await verifyUser(null, () => {
                  SettingsService.set({
                    encryptedBackup: false
                  });
                });
              } else {
                SettingsService.set({
                  encryptedBackup: true
                });
              }
            }
          }
        ]
      },
      {
        id: "restore-backup",
        name: strings.restoreBackup(),
        description: strings.restoreBackupDesc(),
        type: "screen",
        component: "backuprestore"
      },
      {
        id: "export-notes",
        name: strings.exportAllNotes(),
        icon: "export",
        description: strings.exportAllNotesDesc(),
        modifer: () => {
          verifyUser(null, () => {
            ExportNotesSheet.present(undefined, true);
          });
        }
      }
    ]
  },
  {
    id: "productivity",
    name: strings.productivity(),
    sections: [
      {
        id: "notification-notes",
        type: "switch",
        name: strings.quickNoteNotification(),
        description: strings.quickNoteNotificationDesc(),
        property: "notifNotes",
        icon: "form-textbox",
        modifer: () => {
          const settings = SettingsService.get();
          if (settings.notifNotes) {
            Notifications.unpinQuickNote();
          } else {
            Notifications.pinQuickNote(false);
          }
          SettingsService.set({
            notifNotes: !settings.notifNotes
          });
        },
        hidden: () => Platform.OS !== "android"
      },
      {
        id: "reminders",
        type: "screen",
        name: strings.reminders(),
        icon: "bell",
        description: strings.remindersDesc(),
        sections: [
          {
            id: "enable-reminders",
            property: "reminderNotifications",
            type: "switch",
            name: strings.reminderNotification(),
            icon: "bell-outline",
            onChange: (property) => {
              if (property) {
                Notifications.setupReminders();
              } else {
                Notifications.clearAllTriggers();
              }
            },
            description: strings.reminderNotificationDesc()
          },
          {
            id: "snooze-time",
            property: "defaultSnoozeTime",
            type: "input",
            name: strings.defaultSnoozeTime(),
            description: strings.defaultSnoozeTimeDesc(),
            inputProperties: {
              keyboardType: "decimal-pad",
              defaultValue: 5 + "",
              placeholder: strings.setSnoozeTimePlaceholder(),
              onSubmitEditing: () => {
                Notifications.setupReminders();
              }
            }
          },
          {
            id: "reminder-sound-ios",
            type: "screen",
            name: strings.changeNotificationSound(),
            description: strings.changeNotificationSoundDesc(),
            component: "sound-picker",
            icon: "bell-ring",
            hidden: () =>
              Platform.OS === "ios" ||
              (Platform.OS === "android" && Platform.Version > 25)
          },
          {
            id: "reminder-sound-android",
            name: strings.changeNotificationSound(),
            description: strings.changeNotificationSoundDesc(),
            icon: "bell-ring",
            hidden: () =>
              Platform.OS === "ios" ||
              (Platform.OS === "android" && Platform.Version < 26),
            modifer: async () => {
              const id = await Notifications.getChannelId("urgent");
              if (id) {
                await notifee.openNotificationSettings(id);
              }
            }
          }
        ]
      }
    ]
  },
  {
    id: "help-support",
    name: strings.helpAndSupport(),
    sections: [
      {
        id: "report-issue",
        name: strings.reportAnIssue(),
        icon: "bug",
        modifer: () => {
          presentSheet({
            //@ts-ignore Migrate to TS
            component: <Issue />
          });
        },
        description: strings.reportAnIssueDesc()
      },
      {
        id: "email-support",
        name: strings.emailSupport(),
        icon: "mail",
        modifer: () => {
          Clipboard.setString("support@streetwriters.co");
          ToastManager.show({
            heading: strings.emailCopied(),
            type: "success",
            icon: "content-copy"
          });
          setTimeout(() => {
            Linking.openURL("mailto:support@streetwriters.co");
          }, 1000);
        },
        description: strings.emailSupportDesc()
      },
      {
        id: "docs-link",
        name: strings.documentation(),
        modifer: async () => {
          Linking.openURL("https://docs.notesnook.com");
        },
        description: strings.documentationDesc(),
        icon: "file-document"
      },
      {
        id: "debugging",
        name: strings.debugging(),
        description: strings.debuggingDesc(),
        type: "screen",
        icon: "bug",
        sections: [
          {
            id: "debug-logs",
            type: "screen",
            name: strings.debugLogs(),
            description: strings.debugLogsDesc(),
            component: "debug-logs"
          }
        ]
      }
    ]
  },
  {
    id: "community",
    name: strings.community(),
    sections: [
      {
        id: "join-telegram",
        name: strings.joinTelegram(),
        description: strings.joinTelegramDesc(),
        modifer: () => {
          Linking.openURL("https://t.me/notesnook").catch(console.log);
        }
      },
      {
        id: "join-mastodon",
        name: strings.joinMastodon(),
        description: strings.joinMastodonDesc(),
        icon: "mastodon",
        modifer: () => {
          Linking.openURL("https://fosstodon.org/@notesnook").catch(
            console.log
          );
        }
      },
      {
        id: "join-twitter",
        name: strings.followOnX(),
        description: strings.followOnXDesc(),
        icon: "twitter",
        modifer: () => {
          Linking.openURL("https://twitter.com/notesnook").catch(console.log);
        }
      },
      {
        id: "join-discord",
        name: strings.joinDiscord(),
        icon: "discord",
        modifer: async () => {
          Linking.openURL("https://discord.gg/zQBK97EE22").catch(console.log);
        },
        description: strings.joinDiscordDesc()
      }
    ]
  },
  {
    id: "legal",
    name: strings.legal(),
    sections: [
      {
        id: "tos",
        name: strings.tos(),
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/tos");
          } catch (e) {
            console.error(e);
          }
        },
        description: strings.tosDesc()
      },
      {
        id: "privacy-policy",
        name: strings.privacyPolicy(),
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/privacy");
          } catch (e) {
            console.error(e);
          }
        },
        description: strings.privacyPolicyDesc()
      },
      {
        id: "licenses",
        name: strings.licenses(),
        type: "screen",
        component: "licenses",
        description: strings.ossLibs(),
        icon: "open-source-initiative"
      }
    ]
  },
  {
    id: "about",
    name: strings.about(),
    sections: [
      {
        id: "download",
        name: strings.downloadOnDesktop(),
        icon: "monitor",
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/downloads");
          } catch (e) {
            console.error(e);
          }
        },
        description: strings.downloadOnDesktopDesc()
      },
      {
        id: "roadmap",
        name: strings.roadmap(),
        icon: "chart-timeline",
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/roadmap/");
          } catch (e) {
            console.error(e);
          }
        },
        description: strings.roadmapDesc()
      },
      {
        id: "check-for-updates",
        name: strings.checkForUpdates(),
        icon: "cellphone-arrow-down",
        description: strings.checkForUpdatesDesc(),
        modifer: async () => {
          presentSheet({
            //@ts-ignore // Migrate to ts
            component: (ref) => <Update fwdRef={ref} />
          });
        }
      },
      {
        id: "app-version",
        name: strings.appVersion(),
        icon: "alpha-v",
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com");
          } catch (e) {
            console.error(e);
          }
        },
        description: getVersion()
      }
    ]
  }
];
