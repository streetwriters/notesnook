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

import notifee from "@notifee/react-native";
import dayjs from "dayjs";
import React from "react";
import { Linking, Platform } from "react-native";
import { getVersion } from "react-native-device-info";
import * as RNIap from "react-native-iap";
import { enabled } from "react-native-privacy-snapshot";
import { db } from "../../common/database";
import { MMKV } from "../../common/database/mmkv";
import { AttachmentDialog } from "../../components/attachments";
import { ChangePassword } from "../../components/auth/change-password";
import { presentDialog } from "../../components/dialog/functions";
import { ChangeEmail } from "../../components/sheets/change-email";
import ExportNotesSheet from "../../components/sheets/export-notes";
import { Issue } from "../../components/sheets/github/issue";
import { Progress } from "../../components/sheets/progress";
import { Update } from "../../components/sheets/update";
import { useVaultStatus, VaultStatusType } from "../../hooks/use-vault-status";
import BackupService from "../../services/backup";
import BiometicService from "../../services/biometrics";
import {
  eSendEvent,
  openVault,
  presentSheet,
  ToastEvent
} from "../../services/event-manager";
import { setLoginMessage } from "../../services/message";
import Navigation from "../../services/navigation";
import Notifications from "../../services/notifications";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import Sync from "../../services/sync";
import { clearAllStores } from "../../stores";
import { useSettingStore } from "../../stores/use-setting-store";
import { useUserStore } from "../../stores/use-user-store";
import { AndroidModule } from "../../utils";
import { getColorScheme, toggleDarkMode } from "../../utils/color-scheme/utils";
import { SUBSCRIPTION_STATUS } from "../../utils/constants";
import {
  eCloseSheet,
  eCloseSimpleDialog,
  eOpenLoginDialog,
  eOpenRecoveryKeyDialog,
  eOpenRestoreDialog
} from "../../utils/events";
import { sleep } from "../../utils/time";
import { MFARecoveryCodes, MFASheet } from "./2fa";
import AppLock from "./app-lock";
import { useDragState } from "./editor/state";
import { verifyUser } from "./functions";
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
            id: "recovery-key",
            name: "Save data recovery key",
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
            modifer: async () => {
              ChangePassword.present();
            },
            description: "Setup a new password for your account."
          },
          {
            id: "change-email",
            name: "Change email",
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
                name: "Enable two-factor authentication",
                modifer: () => {
                  verifyUser("global", async () => {
                    MFASheet.present();
                  });
                },
                useHook: () => useUserStore((state) => state.user),
                hidden: (user) => {
                  return !!(user as User)?.mfa?.isEnabled;
                },
                description: "Increased security for your account"
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
              },
              {
                id: "disabled-2fa",
                name: "Disable two-factor authentication",
                modifer: () => {
                  verifyUser("global", async () => {
                    await db.mfa?.disable();
                    const user = await db.user?.fetchUser();
                    useUserStore.getState().setUser(user);
                  });
                },

                useHook: () => useUserStore((state) => state.user),
                hidden: (user) => {
                  return !(user as User)?.mfa?.isEnabled;
                },
                description: "Decreased security for your account"
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
            id: "logout",
            name: "Log out",
            description: "Clear all your data and reset the app.",
            icon: "logout",
            modifer: () => {
              presentDialog({
                title: "Logout",
                paragraph: "Clear all your data and reset the app.",
                positiveText: "Logout",
                positivePress: async () => {
                  try {
                    eSendEvent("settings-loading", true);
                    setImmediate(async () => {
                      eSendEvent(eCloseSimpleDialog);
                      Navigation.popToTop();
                      db.user?.logout();
                      setLoginMessage();
                      await PremiumService.setPremiumStatus();
                      await BiometicService.resetCredentials();
                      MMKV.clearStore();
                      await clearAllStores();
                      SettingsService.init();
                      setTimeout(() => {
                        SettingsService.set({
                          introCompleted: true
                        });
                      }, 1000);
                      useUserStore.getState().setUser(null);
                      useUserStore.getState().setSyncing(false);
                      Navigation.goBack();
                      Navigation.popToTop();
                      eSendEvent("settings-loading", false);
                    });
                  } catch (e) {
                    ToastEvent.error(e as Error, "Error logging out");
                    eSendEvent("settings-loading", false);
                  }
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
              "All your data will be removed permanantly. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.",
            modifer: () => {
              presentDialog({
                title: "Delete account",
                paragraphColor: "red",
                paragraph:
                  "All your data will be removed permanantly. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.",
                positiveType: "errorShade",
                input: true,
                inputPlaceholder: "Enter account password",
                positiveText: "Delete",
                positivePress: async (value) => {
                  try {
                    const verified = await db.user?.verifyPassword(value);
                    if (verified) {
                      eSendEvent("settings-loading", true);
                      await db.user?.deleteUser(value);
                      await BiometicService.resetCredentials();
                      SettingsService.set({
                        introCompleted: true
                      });
                    } else {
                      ToastEvent.show({
                        heading: "Incorrect password",
                        message:
                          "The account password you entered is incorrect",
                        type: "error",
                        context: "global"
                      });
                    }

                    eSendEvent("settings-loading", false);
                  } catch (e) {
                    eSendEvent("settings-loading", false);
                    console.log(e);
                    ToastEvent.error(
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
            id: "sync-issues-fix",
            name: "Having problems with sync",
            description: "Try force sync to resolve issues with syncing",
            icon: "sync-alert",
            modifer: async () => {
              presentDialog({
                title: "Force sync",
                paragraph:
                  "If your data on two devices is out of sync even after trying to sync normally. You can run force sync to solve such problems. Usually you should never need to run this otherwise. Force sync means that all your data on this device is reuploaded to the server.",
                negativeText: "Cancel",
                positiveText: "Start",
                positivePress: async () => {
                  eSendEvent(eCloseSheet);
                  await sleep(300);
                  Progress.present();
                  Sync.run("global", true, true, () => {
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
    name: "Customize",
    sections: [
      {
        id: "personalization",
        type: "screen",
        name: "Theme",
        description: "Change app look and feel",
        icon: "shape",
        sections: [
          {
            id: "accent-color-picker",
            type: "component",
            name: "Accent color",
            description: "Pick the color that matches your mood",
            component: "colorpicker"
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
              getColorScheme();
            }
          },
          {
            id: "enable-dark-mode",
            type: "switch",
            name: "Dark mode",
            description: "Strain your eyes no more at night",
            property: "theme",
            icon: "brightness-6",
            modifer: () => {
              toggleDarkMode();
            },
            getter: () => useSettingStore.getState().settings.theme.dark
          },
          {
            id: "pitch-black",
            type: "switch",
            name: "Pitch black",
            description: "Save battery on device with amoled screen at night.",
            property: "pitchBlack",
            modifer: () => {
              SettingsService.set({
                pitchBlack: !SettingsService.get().pitchBlack
              });
              getColorScheme();
            },
            icon: "brightness-1"
          }
        ]
      },
      {
        id: "behaviour",
        type: "screen",
        name: "Behaviour",
        description: "Change app homepage",
        sections: [
          {
            id: "default-home",
            type: "component",
            name: "Homepage",
            description: "Default screen to open on app startup",
            component: "homeselector"
          },
          {
            id: "clear-trash-interval",
            type: "component",
            name: "Clear trash interval",
            description:
              "Select the duration after which trash items will be cleared",
            component: "trash-interval-selector"
          }
        ]
      }
    ]
  },
  {
    id: "privacy-security",
    name: "Privacy and security",
    sections: [
      {
        id: "temeltery",
        type: "switch",
        name: "Telemetry",
        icon: "radar",
        description:
          "Contribute towards a better Notesnook. All tracking information is anonymous.",
        property: "telemetry"
      },
      {
        id: "cors-bypass",
        type: "input",
        name: "CORS bypass proxy",
        description: "You can set a custom proxy URL to increase your privacy.",
        inputProperties: {
          defaultValue: "https://cors.notesnook.com"
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
            id: "biometic-unlock",
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
          Platform.OS === "android"
            ? AndroidModule.setSecureMode(!settings.privacyScreen)
            : enabled(true);

          SettingsService.set({ privacyScreen: !settings.privacyScreen });
        },
        property: "privacyScreen"
      },
      {
        id: "app-lock",
        name: "App lock",
        description: "Change app lock mode to suit your needs",
        icon: "fingerprint",
        modifer: () => {
          AppLock.present();
        }
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
            description: "Create a backup of your data",
            modifer: async () => {
              const user = useUserStore.getState().user;
              if (!user) {
                await BackupService.run(true);
                return;
              }
              verifyUser(null, () => BackupService.run(true));
            }
          },
          {
            id: "auto-backups",
            type: "component",
            name: "Automatic backups",
            description:
              "Backup your data once every week or daily automatically.",
            component: "autobackups"
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
                  ToastEvent.show({
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
                  ToastEvent.show({
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
                ToastEvent.show({
                  heading: "Login required to enable encryption",
                  type: "error",
                  func: () => {
                    eSendEvent(eOpenLoginDialog);
                  },
                  actionText: "Login"
                });
                return;
              }
              SettingsService.set({
                encryptedBackup: !settings.encryptedBackup
              });
            }
          }
        ]
      },
      {
        id: "restore-backup",
        name: "Restore backup",
        description: "Restore backup from phone storage.",
        modifer: () => {
          const user = useUserStore.getState().user;
          if (!user || !user?.email) {
            ToastEvent.show({
              heading: "Login required",
              message: "Please log in to your account to restore backup",
              type: "error",
              context: "global"
            });
            return;
          }
          eSendEvent(eOpenRestoreDialog);
        }
      },
      {
        id: "export-notes",
        name: "Export all notes",
        icon: "export",
        description:
          "Export all notes as pdf, markdown, html or text in a single zip file",
        modifer: () => {
          ExportNotesSheet.present(undefined, true);
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
            id: "reminder-sound",
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
            id: "reminder-sound",
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
    id: "editor",
    name: "Editor",
    sections: [
      {
        id: "configure-toolbar",
        type: "screen",
        name: "Configure toolbar",
        description: "Make the toolbar adaptable to your needs.",
        component: "configuretoolbar"
      },
      {
        id: "reset-toolbar",
        name: "Reset toolbar",
        description: "Reset toolbar configuration to default",
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
          ToastEvent.show({
            heading: "Line spacing changed",
            type: "success"
          });
        }
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
            id: "debug-mode",
            type: "switch",
            name: "Debug mode",
            description: "Show debug options on items",
            property: "devMode"
          },
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
        description: "We are on telegram, let's talk",
        modifer: () => {
          Linking.openURL("https://t.me/notesnook").catch(console.log);
        }
      },
      {
        id: "join-mastodom",
        name: "Follow us on Mastodon",
        description: "We are on mastodom",
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
        description: "Read our terms of service"
      },
      {
        id: "privacy-policy",
        name: "Privacy policy",
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
