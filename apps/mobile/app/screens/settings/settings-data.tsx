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
import notifee from "@notifee/react-native";
import dayjs from "dayjs";
import React from "react";
import { Appearance, Linking, Platform } from "react-native";
import { getVersion } from "react-native-device-info";
import * as RNIap from "react-native-iap";
import { enabled } from "react-native-privacy-snapshot";
import ScreenGuardModule from "react-native-screenguard";
import { DatabaseLogger, db } from "../../common/database";
import { MMKV } from "../../common/database/mmkv";
import filesystem from "../../common/filesystem";
import { AttachmentDialog } from "../../components/attachments";
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
import { setLoginMessage } from "../../services/message";
import Navigation from "../../services/navigation";
import Notifications from "../../services/notifications";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import Sync from "../../services/sync";
import { clearAllStores } from "../../stores";
import { refreshAllStores } from "../../stores/create-db-collection-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { SUBSCRIPTION_STATUS } from "../../utils/constants";
import {
  eCloseSheet,
  eCloseSimpleDialog,
  eOpenLoginDialog,
  eOpenRecoveryKeyDialog
} from "../../utils/events";
import { NotesnookModule } from "../../utils/notesnook-module";
import { sleep } from "../../utils/time";
import { MFARecoveryCodes, MFASheet } from "./2fa";
import { useDragState } from "./editor/state";
import { verifyUser, verifyUserWithApplock } from "./functions";
import { SettingSection } from "./types";
import { getTimeLeft } from "./user-section";

type User = any;

export const settingsGroups: SettingSection[] = [
  {
    id: "account",
    name: "account",
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
            ? "Subscribe to Pro"
            : isTrial
            ? "Your free trial has started"
            : "Subscription details";
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

          return user.subscription?.type === 2
            ? "You signed up on " + startDate
            : user.subscription?.type === 1
            ? "Your free trial will end on " + expiryDate
            : user.subscription?.type === 6
            ? subscriptionDaysLeft.time < -3
              ? "Your subscription has ended"
              : "Your account will be downgraded to Basic in 3 days"
            : user.subscription?.type === 7
            ? `Your subscription will end on ${expiryDate}.`
            : user.subscription?.type === 5
            ? `Your subscription will renew on ${expiryDate}.`
            : "Never hesitate to choose privacy";
        }
      },
      {
        id: "account-settings",
        type: "screen",
        name: "Account Settings",
        icon: "account-cog",
        description: "Manage account",
        sections: [
          {
            id: "remove-profile-picture",
            name: "Remove profile picture",
            icon: "face-man",
            description: "Remove your picture from profile",
            useHook: () =>
              useUserStore((state) => state.profile?.profilePicture),
            hidden: () => !useUserStore.getState().profile?.profilePicture,
            modifer: () => {
              presentDialog({
                title: "Remove profile picture",
                paragraph:
                  "Are you sure you want to remove your profile picture?",
                positiveText: "Remove",
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
            name: "Remove full name",
            icon: "rename-box",
            description: "Remove your name from profile",
            useHook: () => useUserStore((state) => state.profile?.fullName),
            hidden: () => !useUserStore.getState().profile?.fullName,
            modifer: () => {
              presentDialog({
                title: "Remove name",
                paragraph: "Are you sure you want to remove your name?",
                positiveText: "Remove",
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
            name: "Save data recovery key",
            icon: "account-key",
            modifer: async () => {
              verifyUser(null, async () => {
                await sleep(300);
                eSendEvent(eOpenRecoveryKeyDialog);
              });
            },
            description:
              "Recover your data using the recovery key if your password is lost."
          },
          {
            id: "manage-attachments",
            name: "Manage attachments",
            icon: "attachment",
            modifer: () => {
              AttachmentDialog.present();
            },
            description: "Manage all attachments in one place."
          },
          {
            id: "change-password",
            name: "Change password",
            icon: "password",
            modifer: async () => {
              ChangePassword.present();
            },
            description: "Setup a new password for your account."
          },
          {
            id: "change-email",
            name: "Change email",
            icon: "email",
            modifer: async () => {
              ChangeEmail.present();
            },
            description: "Setup a new email for your account."
          },
          {
            id: "2fa-settings",
            type: "screen",
            name: "Two factor authentication",
            description: "Manage 2FA settings",
            icon: "two-factor-authentication",
            sections: [
              {
                id: "enable-2fa",
                name: "Change primary two-factor authentication",
                modifer: () => {
                  verifyUser("global", async () => {
                    MFASheet.present();
                  });
                },
                useHook: () => useUserStore((state) => state.user),
                description:
                  "Change your current two-factor authentication method"
              },
              {
                id: "2fa-fallback",
                name: "Add fallback 2FA method",
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
                description:
                  "You can use fallback 2FA method incase you are unable to login via primary method"
              },
              {
                id: "change-2fa-method",
                name: "Reconfigure fallback 2FA method",
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
                description:
                  "You can use fallback 2FA method incase you are unable to login via primary method"
              },
              {
                id: "view-2fa-codes",
                name: "View recovery codes",
                modifer: () => {
                  verifyUser("global", async () => {
                    MFARecoveryCodes.present("sms");
                  });
                },
                useHook: () => useUserStore((state) => state.user),
                hidden: (user) => {
                  return !(user as User)?.mfa?.isEnabled;
                },
                description:
                  "View and save recovery codes for to recover your account"
              }
            ]
          },
          {
            id: "subscription-not-active",
            name: "Subscription not activated?",
            hidden: () => Platform.OS !== "ios",
            modifer: async () => {
              if (Platform.OS === "android") return;
              presentSheet({
                title: "Loading subscriptions",
                paragraph: "Please wait while we fetch your subscriptions."
              });
              const subscriptions = await RNIap.getPurchaseHistory();
              subscriptions.sort(
                (a, b) => b.transactionDate - a.transactionDate
              );
              const currentSubscription = subscriptions[0];
              presentSheet({
                title: "Notesnook Pro",
                paragraph: `You subscribed to Notesnook Pro on ${new Date(
                  currentSubscription.transactionDate
                ).toLocaleString()}. Verify this subscription?`,
                action: async () => {
                  presentSheet({
                    title: "Verifying subscription",
                    paragraph: "Please wait while we verify your subscription."
                  });
                  await PremiumService.subscriptions.verify(
                    currentSubscription
                  );
                  eSendEvent(eCloseSheet);
                },
                icon: "information-outline",
                actionText: "Verify"
              });
            },
            description: "Verify your subscription to Notesnook Pro"
          },
          {
            id: "clear-cache",
            name: "Clear cache",
            icon: "delete",
            modifer: async () => {
              presentDialog({
                title: "Clear cache",
                paragraph: "Are you sure you want to clear the cache?",
                positiveText: "Clear",
                positivePress: async () => {
                  filesystem.clearCache();
                  ToastManager.show({
                    heading: "Cache cleared",
                    message: "All cached attachments have been removed",
                    type: "success"
                  });
                }
              });
            },
            description(current) {
              return `Clear all cached attachments. Current cache size: ${
                current as number
              }`;
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
            name: "Logout",
            description:
              "Logging out will clear all data stored on this device.",
            icon: "logout",
            modifer: async () => {
              const hasUnsyncedChanges = await db.hasUnsyncedChanges();
              presentDialog({
                title: "Logout",
                paragraph:
                  "Are you sure you want to logout and clear all data stored on this device?",
                positiveText: "Logout",
                check: {
                  info: "Take a backup before logging out",
                  defaultValue: true
                },
                notice: hasUnsyncedChanges
                  ? {
                      text: "You have unsynced notes. Take a backup or sync your notes to avoid losing your critical data.",
                      type: "alert"
                    }
                  : undefined,
                positivePress: async (_, takeBackup) => {
                  eSendEvent(eCloseSimpleDialog);
                  setTimeout(async () => {
                    try {
                      startProgress({
                        fillBackground: true,
                        title: "Logging out",
                        canHideProgress: true,
                        paragraph:
                          "Please wait while we log out and clear app data."
                      });

                      Navigation.navigate("Notes");

                      if (takeBackup) {
                        updateProgress({
                          progress: "Taking a backup of your notes"
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
                              title: "Backup failed",
                              paragraph: `${
                                (error as Error).message
                              }. Do you want to continue logging out?`,
                              positiveText: "Continue",
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
                        progress: "Logging out... please wait"
                      });

                      await db.user?.logout();
                      setLoginMessage();
                      await PremiumService.setPremiumStatus();
                      await BiometricService.resetCredentials();
                      MMKV.clearStore();
                      clearAllStores();
                      setImmediate(() => {
                        refreshAllStores();
                      });
                      Navigation.queueRoutesForUpdate();
                      SettingsService.resetSettings();
                      useUserStore.getState().setUser(null);
                      useUserStore.getState().setSyncing(false);
                      endProgress();
                    } catch (e) {
                      DatabaseLogger.error(e);
                      ToastManager.error(e as Error, "Error logging out");
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
            name: "Delete account",
            icon: "alert",
            description:
              "All your data will be removed permanently. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.",
            modifer: () => {
              presentDialog({
                title: "Delete account",
                paragraphColor: "red",
                paragraph:
                  "All your data will be removed permanently. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.",
                positiveType: "errorShade",
                input: true,
                inputPlaceholder: "Enter account password",
                positiveText: "Delete",
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
                        heading: "Incorrect password",
                        message:
                          "The account password you entered is incorrect",
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
                      "Failed to delete account",
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
        name: "Sync settings",
        description: "Configure syncing for this device",
        type: "screen",
        icon: "autorenew",
        sections: [
          {
            id: "offline-mode",
            name: "Full offline mode",
            description: "Download everything including attachments on sync",
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
            name: "Disable auto sync",
            description:
              "Turn off automatic syncing. Changes from this client will be synced only when you run sync manually.",
            type: "switch",
            property: "disableAutoSync"
          },
          {
            id: "disable-realtime-sync",
            name: "Disable realtime sync",
            description: "Turn off realtime sync in the editor.",
            type: "switch",
            property: "disableRealtimeSync"
          },
          {
            id: "disable-sync",
            name: "Disable syncing",
            description:
              "Turns off syncing completely on this device. Any changes made will remain local only and new changes from your other devices won't sync to this device.",
            type: "switch",
            property: "disableSync"
          },
          {
            id: "background-sync",
            name: "Background sync (experimental)",
            description:
              "Periodically wake up the app in background to run sync.",
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
            name: "Force pull changes",
            description: `Use this if changes from other devices are not appearing on this device. This will overwrite the data on this device with the latest data from the server.\n\nThis must only be used for troubleshooting. Using it regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`,
            modifer: () => {
              presentDialog({
                title: "Force Pull changes",
                paragraph:
                  "This must only be used for troubleshooting. Using this regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.",
                negativeText: "Cancel",
                positiveText: "Start",
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
            name: "Force push changes",
            description: `Use this if changes made on this device are not appearing on other devices. This will overwrite the data on the server with the data from this device.\n\nThis must only be used for troubleshooting. Using it regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`,
            modifer: () => {
              presentDialog({
                title: "Force Push changes",
                paragraph:
                  "This must only be used for troubleshooting. Using this regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.",
                negativeText: "Cancel",
                positiveText: "Start",
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
    name: "Customization",
    sections: [
      {
        id: "personalization",
        type: "screen",
        name: "Appearance",
        description: "Change app look and feel with color themes",
        icon: "shape",
        sections: [
          {
            id: "theme-picker",
            type: "screen",
            name: "Themes",
            icon: "palette",
            description: "Customize Notesnook to absolute infinity.",
            component: "theme-selector"
          },
          {
            id: "use-system-theme",
            type: "switch",
            name: "Use system theme",
            description:
              "Automatically switch to dark mode when system theme changes",
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
            name: "Dark mode",
            description: "Strain your eyes no more at night",
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
        name: "Behaviour",
        icon: "cog",
        description: "Change how the app behaves in different situations",
        sections: [
          {
            id: "default-home",
            type: "component",
            name: "Homepage",
            description: "Default screen to open on app startup",
            component: "homeselector"
          },
          {
            id: "date-format",
            name: "Date format",
            description: "Set the format for date used across the app",
            type: "component",
            component: "date-format-selector"
          },
          {
            id: "time-format",
            name: "Time format",
            description: "Set the format for time used across the app",
            type: "component",
            component: "time-format-selector"
          },
          {
            id: "clear-trash-interval",
            type: "component",
            name: "Clear trash interval",
            description:
              "Select the duration after which trash items will be cleared",
            component: "trash-interval-selector"
          },
          {
            id: "default-notebook",
            name: "Clear default notebook",
            description: "Clear the default notebook for new notes",
            modifer: () => {
              db.settings.setDefaultNotebook(undefined);
            },
            hidden: () => !db.settings.getDefaultNotebook()
          }
        ]
      },
      {
        id: "editor",
        name: "Editor",
        type: "screen",
        icon: "note-edit-outline",
        description: "Customize the editor to fit your needs",
        sections: [
          {
            id: "configure-toolbar",
            type: "screen",
            name: "Configure toolbar",
            description: "Make the toolbar adaptable to your needs.",
            icon: "format-text",
            component: "configuretoolbar"
          },
          {
            id: "reset-toolbar",
            name: "Reset toolbar",
            description: "Reset toolbar configuration to default",
            icon: "reload",
            modifer: () => {
              useDragState.getState().setPreset("default");
            }
          },
          {
            id: "double-spaced-lines",
            name: "Use double spaced lines",
            description:
              "New lines will be double spaced (old ones won't be affected).",
            type: "switch",
            property: "doubleSpacedLines",
            icon: "format-line-spacing",
            onChange: () => {
              ToastManager.show({
                heading: "Line spacing changed",
                type: "success"
              });
            }
          },
          {
            id: "default-font-size",
            name: "Default font size",
            description: "Set the default font size in editor",
            type: "input-selector",
            minInputValue: 8,
            maxInputValue: 120,
            icon: "format-size",
            property: "defaultFontSize"
          },
          {
            id: "default-font-family",
            name: "Default font family",
            description: "Set the default font family in editor",
            type: "component",
            icon: "format-font",
            property: "defaultFontFamily",
            component: "font-selector"
          },
          {
            id: "title-format",
            name: "Title format",
            component: "title-format",
            icon: "format-title",
            description: "Customize the formatting for new note title",
            type: "component"
          },
          {
            id: "toggle-markdown",
            name: "Markdown shortcuts",
            property: "markdownShortcuts",
            description: "Toggle markdown in the editor",
            icon: "language-markdown",
            type: "switch"
          }
        ]
      },
      {
        id: "servers",
        type: "screen",
        name: "Servers",
        description: "Configure server URLs for Notesnook",
        icon: "server",
        component: "server-config"
      }
    ]
  },
  {
    id: "privacy-security",
    name: "Privacy and security",
    sections: [
      {
        id: "marketing-emails",
        type: "switch",
        name: "Marketing emails",
        icon: "email-fast",
        description:
          "We will send you occasional promotional offers & product updates on your email (sent once every month).",
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
        name: "CORS bypass proxy",
        description: "You can set a custom proxy URL to increase your privacy.",
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
        name: "Vault",
        description: "Multi-layer encryption to most important notes",
        icon: "key",
        sections: [
          {
            id: "create-vault",
            name: "Create vault",
            description: "Set a password to create vault and lock notes.",
            icon: "key",
            useHook: useVaultStatus,
            hidden: (current) => (current as VaultStatusType)?.exists,
            modifer: () => {
              PremiumService.verify(() => {
                openVault({
                  item: {},
                  novault: false,
                  title: "Create vault",
                  description: "Set a password to create vault and lock notes."
                });
              });
            }
          },
          {
            id: "change-vault-password",
            useHook: useVaultStatus,
            name: "Change vault password",
            icon: "key-change",
            description: "Setup a new password for your vault.",
            hidden: (current) => !(current as VaultStatusType)?.exists,
            modifer: () =>
              openVault({
                item: {},
                changePassword: true,
                novault: true,
                title: "Change vault password",
                description: "Set a new password for your vault."
              })
          },
          {
            id: "clear-vault",
            useHook: useVaultStatus,
            name: "Clear vault",
            icon: "key-remove",
            description: "Unlock all locked notes",
            hidden: (current) => !(current as VaultStatusType)?.exists,
            modifer: () => {
              openVault({
                item: {},
                clearVault: true,
                novault: true,
                title: "Clear vault",
                description:
                  "Enter vault password to unlock and remove all notes from the vault."
              });
            }
          },
          {
            id: "delete-vault",
            name: "Delete vault",
            icon: "delete-forever",
            description: "Delete vault (and optionally remove all notes).",
            useHook: useVaultStatus,
            hidden: (current) => !(current as VaultStatusType)?.exists,
            modifer: () => {
              openVault({
                item: {},
                deleteVault: true,
                novault: true,
                title: "Delete vault",
                description: "Enter your account password to delete your vault."
              });
            }
          },
          {
            id: "biometric-unlock",
            type: "switch",
            name: "Biometric unlocking",
            icon: "fingerprint",
            useHook: useVaultStatus,
            description: "Access notes in vault using biometrics",
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
                  ? "Revoke biometric unlocking"
                  : "Enable biometery unlock",
                description: _current.biometryEnrolled
                  ? "Disable biometric unlocking for notes in vault"
                  : "Enable biometric unlocking for notes in vault"
              });
            }
          }
        ]
      },
      {
        id: "privacy-mode",
        type: "switch",
        icon: "eye-off-outline",
        name: "Privacy mode",
        description:
          "Hide app contents when you switch to other apps. This will also disable screenshot taking in the app.",
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
        name: "App lock",
        type: "screen",
        description: "Enhanced at rest encryption with app lock",
        icon: "lock",
        sections: [
          {
            id: "app-lock-mode",
            name: "App lock",
            description: "Keep intruders away with app lock security.",
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
                    heading: "Biometrics not enrolled",
                    type: "error",
                    message:
                      "To use app lock, you must enable biometrics such as Fingerprint lock or Face ID on your phone."
                  });
                  return false;
                }
              }

              return verified;
            }
          },
          {
            id: "app-lock-timer",
            name: "App lock timeout",
            description:
              "Set the time after which the app should lock when in background",
            type: "component",
            component: "applock-timer"
          },
          {
            id: "app-lock-pin",
            name: () =>
              `Setup app lock ${
                SettingsService.getProperty("applockKeyboardType") === "numeric"
                  ? "pin"
                  : "password"
              }`,
            description: () =>
              `Set up a ${
                SettingsService.getProperty("applockKeyboardType") === "numeric"
                  ? "pin"
                  : "password"
              } for app lock`,
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
              console.log("called modifier..");
              AppLockPassword.present("create");
            }
          },
          {
            id: "app-lock-pin-change",
            name: () =>
              `Change app lock ${
                SettingsService.getProperty("applockKeyboardType") === "numeric"
                  ? "pin"
                  : "password"
              }`,
            description: () =>
              `Set up a ${
                SettingsService.getProperty("applockKeyboardType") === "numeric"
                  ? "pin"
                  : "password"
              } for app lock`,
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
              `Remove app lock ${
                SettingsService.getProperty("applockKeyboardType") === "numeric"
                  ? "pin"
                  : "password"
              }`,
            description: () =>
              `Remove app lock ${
                SettingsService.getProperty("applockKeyboardType") === "numeric"
                  ? "pin"
                  : "password"
              }, app lock will be disabled if no other security method is enabled.`,
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
            name: "Unlock with biometrics",
            description: "Allow biometric authentication to unlock the app",
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
                    heading: "App lock disabled",
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
    name: "Backup and restore",
    sections: [
      {
        id: "backups",
        type: "screen",
        name: "Backups",
        icon: "backup-restore",
        description: "Create a backup or change backup settings",
        sections: [
          {
            id: "backup-now",
            name: "Backup now",
            description:
              "Take a partial backup of your data that does not include attachments",
            icon: "backup",
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
            name: "Backup now with attachments",
            hidden: () => !useUserStore.getState().user,
            description: "Take a full backup of your data with all attachments",
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
            name: "Automatic backups",
            icon: "clock",
            description:
              "Set the interval to create a partial backup (without attachments) automatically.",
            component: "autobackups"
          },
          {
            id: "auto-backups-with-attachments",
            type: "component",
            hidden: () => !useUserStore.getState().user,
            name: "Automatic backups with attachments",
            description: `Set the interval to create a backup (with attachments) automatically.

NOTE: Creating a backup with attachments can take a while, and also fail completely. The app will try to resume/restart the backup in case of interruptions.`,
            component: "autobackupsattachments"
          },
          {
            id: "select-backup-dir",
            name: "Select backup directory",
            description: "Select directory to store backups",
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
                    heading: "No directory selected",
                    type: "error"
                  });
                }
              }
            }
          },
          {
            id: "change-backup-dir",
            name: "Change backup directory",
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
                    heading: "No directory selected",
                    type: "error"
                  });
                }
              }
            }
          },
          {
            id: "enable-backup-encryption",
            type: "switch",
            name: "Backup encryption",
            description: "Encrypt all your backups.",
            icon: "lock",
            property: "encryptedBackup",
            modifer: async () => {
              const user = useUserStore.getState().user;
              const settings = SettingsService.get();
              if (!user) {
                ToastManager.show({
                  heading: "Login required to enable encryption",
                  type: "error",
                  func: () => {
                    eSendEvent(eOpenLoginDialog);
                  },
                  actionText: "Login"
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
        name: "Restore backup",
        description: "Restore backup from phone storage.",
        type: "screen",
        component: "backuprestore"
      },
      {
        id: "export-notes",
        name: "Export all notes",
        icon: "export",
        description:
          "Export all notes as pdf, markdown, html or text in a single zip file",
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
    name: "Productivity",
    sections: [
      {
        id: "notification-notes",
        type: "switch",
        name: "Notes in notifications",
        description:
          "Add quick notes from notifications without opening the app.",
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
        name: "Reminders",
        icon: "bell",
        description: "Manage and configure reminders in app",
        sections: [
          {
            id: "enable-reminders",
            property: "reminderNotifications",
            type: "switch",
            name: "Reminder notifications",
            icon: "bell-outline",
            onChange: (property) => {
              if (property) {
                Notifications.setupReminders();
              } else {
                Notifications.clearAllTriggers();
              }
            },
            description:
              "Controls whether this device should receive reminder notifications."
          },
          {
            id: "snooze-time",
            property: "defaultSnoozeTime",
            type: "input",
            name: "Default snooze time",
            icon: "alarm-snooze",
            description:
              "Set the default time to snooze a reminder to when you press the snooze button on a notification.",
            inputProperties: {
              keyboardType: "decimal-pad",
              defaultValue: 5 + "",
              placeholder: "Set snooze time in minutes",
              onSubmitEditing: () => {
                Notifications.setupReminders();
              }
            }
          },
          {
            id: "reminder-sound-ios",
            type: "screen",
            name: "Change notification sound",
            description:
              "Set the notification sound for reminder notifications",
            component: "sound-picker",
            icon: "bell-ring",
            hidden: () =>
              Platform.OS === "ios" ||
              (Platform.OS === "android" && Platform.Version > 25)
          },
          {
            id: "reminder-sound-android",
            name: "Change notification sound",
            description:
              "Set the notification sound for reminder notifications",
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
    name: "Help and support",
    sections: [
      {
        id: "report-issue",
        name: "Report an issue",
        icon: "bug",
        modifer: () => {
          presentSheet({
            //@ts-ignore Migrate to TS
            component: <Issue />
          });
        },
        description:
          "Faced an issue or have a suggestion? Click here to create a bug report"
      },
      {
        id: "email-support",
        name: "Email support",
        icon: "mail",
        modifer: () => {
          Linking.openURL("mailto:support@streetwriters.co");
        },
        description:
          "Reach out to us via email and let us resolve your issue directly."
      },
      {
        id: "docs-link",
        name: "Documentation",
        modifer: async () => {
          Linking.openURL("https://docs.notesnook.com");
        },
        description: "Learn about every feature and how it works.",
        icon: "file-document"
      },
      {
        id: "debugging",
        name: "Debugging",
        description:
          "Get helpful debug info about the app to help us find bugs.",
        type: "screen",
        icon: "bug",
        sections: [
          {
            id: "debug-logs",
            type: "screen",
            name: "Debug logs",
            description: "View debug logs from the app",
            component: "debug-logs"
          }
        ]
      }
    ]
  },
  {
    id: "community",
    name: "community",
    sections: [
      {
        id: "join-telegram",
        name: "Join our Telegram group",
        icon: "message-text",
        description: "We are on telegram, let's talk",
        modifer: () => {
          Linking.openURL("https://t.me/notesnook").catch(console.log);
        }
      },
      {
        id: "join-mastodon",
        name: "Follow us on Mastodon",
        description: "We are on mastodon",
        icon: "mastodon",
        modifer: () => {
          Linking.openURL("https://fosstodon.org/@notesnook").catch(
            console.log
          );
        }
      },
      {
        id: "join-twitter",
        name: "Follow us on twitter",
        description: "Stay updated with the latest news about Notesnook",
        icon: "twitter",
        modifer: () => {
          Linking.openURL("https://twitter.com/notesnook").catch(console.log);
        }
      },
      {
        id: "join-discord",
        name: "Join our Discord community",
        icon: "discord",
        modifer: async () => {
          presentSheet({
            title: "Join our Discord Community",
            iconColor: "discord",
            paragraph:
              "We are not ghosts, chat with us and share your experience.",
            valueArray: [
              "Talk with us anytime.",
              "Follow the development process",
              "Give suggestions and report issues.",
              "Get early access to new features",
              "Meet other people using Notesnook"
            ],
            icon: "discord",
            action: async () => {
              try {
                Linking.openURL("https://discord.gg/zQBK97EE22").catch(
                  console.log
                );
              } catch (e) {
                console.error(e);
              }
            },
            actionText: "Join Now"
          });
        },
        description:
          "We are not ghosts, chat with us and share your experience."
      }
    ]
  },
  {
    id: "legal",
    name: "legal",
    sections: [
      {
        id: "tos",
        name: "Terms of service",
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/tos");
          } catch (e) {
            console.error(e);
          }
        },
        icon: "file-document",
        description: "Read our terms of service"
      },
      {
        id: "privacy-policy",
        name: "Privacy policy",
        icon: "shield",
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/privacy");
          } catch (e) {
            console.error(e);
          }
        },
        description: "Read our privacy policy"
      },
      {
        id: "licenses",
        name: "Open source Licenses",
        type: "screen",
        component: "licenses",
        description: "Open source libraries used in Notesnook",
        icon: "open-source-initiative"
      }
    ]
  },
  {
    id: "about",
    name: "about",
    sections: [
      {
        id: "download",
        name: "Download on desktop",
        icon: "monitor",
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/downloads");
          } catch (e) {
            console.error(e);
          }
        },
        description: "Get Notesnook app on your desktop and access all notes"
      },
      {
        id: "roadmap",
        name: "Roadmap",
        icon: "chart-timeline",
        modifer: async () => {
          try {
            await Linking.openURL("https://notesnook.com/roadmap/");
          } catch (e) {
            console.error(e);
          }
        },
        description: "See what the future of Notesnook is going to be like."
      },
      {
        id: "check-for-updates",
        name: "Check for updates",
        icon: "cellphone-arrow-down",
        description: "Check for new version of Notesnook",
        modifer: async () => {
          presentSheet({
            //@ts-ignore // Migrate to ts
            component: (ref) => <Update fwdRef={ref} />
          });
        }
      },
      {
        id: "app-version",
        name: "App version",
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
