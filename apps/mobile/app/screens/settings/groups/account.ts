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
import { SubscriptionPlan, User } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import React from "react";
import { Platform } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import * as RNIap from "react-native-iap";
import { DatabaseLogger, db } from "../../../common/database";
import filesystem from "../../../common/filesystem";
import { presentDialog } from "../../../components/dialog/functions";
import {
  endProgress,
  startProgress
} from "../../../components/dialogs/progress";
import ForceSyncSheet from "../../../components/sheets/force-sync";
import { BackgroundSync } from "../../../services/background-sync";
import BiometricService from "../../../services/biometrics";
import Navigation from "../../../services/navigation";
import PremiumService from "../../../services/premium";
import SettingsService from "../../../services/settings";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useUserStore } from "../../../stores/use-user-store";
import {
  createFormRef,
  validators
} from "../../../components/ui/input/form-input";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  presentSheet
} from "../../../services/event-manager";
import { eCloseSheet } from "../../../utils/events";
import { MFARecoveryCodes, MFASheet } from "../components/2fa";
import { verifyUser } from "../verify-user";
import { logoutUser } from "../logout";
import { SettingSection } from "../types";
import RecoveryKeySheet from "../../../components/sheets/recovery-key";

export const accountGroup: SettingSection = {
  id: "account",
  name: strings.account(),
  useHook: () => useUserStore((state) => state.user),
  hidden: (current) => !current,
  sections: [
    // {
    //   id: "subscription-status",
    //   useHook: () => useUserStore((state) => state.user),
    //   hidden: (current) => {
    //     const user = current as User;
    //     return (
    //       !user ||
    //       !user.subscription ||
    //       user.subscription.provider === undefined ||
    //       !strings.subscriptionProviderInfo[user?.subscription?.provider] ||
    //       user.subscription?.plan === SubscriptionPlan.FREE
    //     );
    //   },
    //   name: (current) => {
    //     const user = (current as User) || useUserStore.getState().user;
    //     return (
    //       strings.subscriptionProviderInfo[
    //         user?.subscription?.provider
    //       ]?.title() || `Unknown provider id: ${user?.subscription?.provider}`
    //     );
    //   },
    //   icon: "credit-card",
    //   modifer: () => {
    //     const user = useUserStore.getState().user;
    //     if (!user) return;
    //     const subscriptionProviderInfo =
    //       strings.subscriptionProviderInfo[user?.subscription?.provider];

    //     if (!subscriptionProviderInfo) return;

    //     const isCurrentPlatform =
    //       (user.subscription?.provider === SubscriptionProvider.APPLE &&
    //         Platform.OS === "ios") ||
    //       (user.subscription?.provider === SubscriptionProvider.GOOGLE &&
    //         Platform.OS === "android");

    //     if (
    //       (user.subscription?.provider === SubscriptionProvider.GOOGLE ||
    //         user.subscription?.provider === SubscriptionProvider.APPLE) &&
    //       isCurrentPlatform &&
    //       user?.subscription?.productId
    //     ) {
    //       RNIap.deepLinkToSubscriptions({
    //         sku: user?.subscription.productId
    //       });
    //     } else {
    //       presentSheet({
    //         title: subscriptionProviderInfo.title(),
    //         paragraph: subscriptionProviderInfo.desc()
    //       });
    //     }
    //   },
    //   description: (current) => {
    //     const user = current as User;
    //     if (!user) return strings.neverHesitate();
    //     const subscriptionDaysLeft =
    //       user && getTimeLeft(user.subscription?.expiry);
    //     const expiryDate = dayjs(user?.subscription?.expiry).format(
    //       "dddd, MMMM D, YYYY h:mm A"
    //     );
    //     const startDate = dayjs(user?.subscription?.start).format(
    //       "dddd, MMMM D, YYYY h:mm A"
    //     );

    //     const trialEndDate = dayjs(user?.subscription?.start)
    //       .add(
    //         user?.subscription?.productId?.includes("monthly") ? 7 : 14,
    //         "day"
    //       )
    //       .format("dddd, MMMM D, YYYY h:mm A");

    //     if (
    //       user.subscription?.plan !== SubscriptionPlan.FREE &&
    //       user.subscription?.productId
    //     ) {
    //       const status = user.subscription?.status;
    //       return status === SubscriptionStatus.TRIAL
    //         ? strings.trialOnGoing(trialEndDate)
    //         : status === SubscriptionStatus.ACTIVE
    //           ? strings.subRenewOn(expiryDate)
    //           : status === SubscriptionStatus.CANCELED ||
    //               status === SubscriptionStatus.PAUSED
    //             ? strings.subEndsOn(expiryDate)
    //             : status === SubscriptionStatus.EXPIRED
    //               ? subscriptionDaysLeft.time < -3
    //                 ? strings.subEnded()
    //                 : strings.accountDowngradedIn(3)
    //               : strings.neverHesitate();
    //     }

    //     return strings.neverHesitate();
    //   }
    // },
    {
      id: "redeem-gift-code",
      name: strings.redeemGiftCode(),
      description: strings.redeemGiftCodeDesc(),
      hidden: (current) => {
        return !current as boolean;
      },
      useHook: () =>
        useUserStore(
          (state) => state.user?.subscription?.plan === SubscriptionPlan.FREE
        ),
      icon: "gift",
      iconFamily: "notesnook",
      modifer: () => {
        presentDialog({
          title: strings.redeemGiftCode(),
          paragraph: strings.redeemGiftCodeDesc(),
          form: {
            formRef: createFormRef({
              code: ""
            }),
            items: [
              {
                name: "code",
                placeholder: strings.code(),
                ref: React.createRef<TextInput | null>(),
                validators: [validators.required(strings.giftCodeRequired())]
              }
            ],
            onFormSubmit: async (form) => {
              try {
                await db.subscriptions.redeemCode(form.getValue("code"));
                return true;
              } catch (e) {
                form.setError("code", (e as Error).message);
                return false;
              }
            }
          },
          positiveText: strings.redeem()
        });
      }
    },
    {
      id: "account-settings",
      type: "screen",
      name: strings.manageAccount(),
      component: "account-card",
      icon: "user",
      iconFamily: "notesnook",
      description: strings.manageAccountDesc(),
      sections: [
        {
          id: "account-sub-section",
          type: "group",
          name: strings.account(),
          icon: "user",
          iconFamily: "notesnook",
          sections: [
            {
              id: "edit-profile",
              type: "screen",
              name: strings.editProfile(),
              description: strings.editProfileDesc(),
              icon: "user",
              iconFamily: "notesnook",
              sections: [
                {
                  id: "remove-profile-picture",
                  icon: "trash",
                  iconFamily: "notesnook",
                  name: strings.removeProfilePicture(),
                  description: strings.removeProfilePictureDesc(),
                  useHook: () =>
                    useUserStore((state) => state.profile?.profilePicture),
                  hidden: () =>
                    !useUserStore.getState().profile?.profilePicture,
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
                  icon: "trash",
                  iconFamily: "notesnook",
                  name: strings.removeFullName(),
                  description: strings.removeFullNameDesc(),
                  useHook: () =>
                    useUserStore((state) => state.profile?.fullName),
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
                  id: "change-email",
                  name: strings.changeEmail(),
                  type: "screen",
                  component: "change-email",
                  description: strings.changeEmailDesc(),
                  icon: "at",
                  headerBottomBorder: true
                }
              ]
            },
            {
              id: "subscription-not-active",
              name: strings.subscriptionNotActivated(),
              icon: "warning-circle",
              iconFamily: "notesnook",
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
                    new Date(
                      currentSubscription.transactionDate
                    ).toLocaleString()
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
            }
          ]
        },
        {
          id: "security-sub-section",
          type: "group",
          name: strings.privacyAndSecurity(),
          icon: "two-factor-authentication",
          sections: [
            {
              id: "change-password",
              name: strings.changePassword(),
              type: "screen",
              description: strings.changePasswordDesc(),
              component: "change-password",
              icon: "pencil-simple-line",
              iconFamily: "notesnook",
              headerBottomBorder: true
            },
            {
              id: "2fa-settings",
              type: "screen",
              name: strings.twoFactorAuth(),
              description: strings.twoFactorAuthDesc(),
              icon: "shield-check",
              iconFamily: "notesnook",
              sections: [
                {
                  id: "2fa-settings-group",
                  name: strings.twoFactorAuth(),
                  type: "group",
                  sections: [
                    {
                      id: "enable-2fa",
                      name: strings.change2faMethod(),
                      icon: "shield-check",
                      iconFamily: "notesnook",
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
                      icon: "shield-plus",
                      iconFamily: "notesnook",
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
                      icon: "shield-plus",
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
                      icon: "numpad",
                      iconFamily: "notesnook",
                      useHook: () => useUserStore((state) => state.user),
                      hidden: (user) => {
                        return !(user as User)?.mfa?.isEnabled;
                      },
                      description: strings.viewRecoveryCodesDesc()
                    }
                  ]
                }
              ]
            },
            {
              id: "recovery-key",
              name: strings.saveDataRecoveryKey(),
              iconFamily: "notesnook",
              modifer: async () => {
                // if (await verifyUser()) {

                // }
                RecoveryKeySheet.present();
              },
              description: strings.saveDataRecoveryKeyDesc(),
              icon: "key"
            }
          ]
        },
        {
          id: "data-storage-sub-section",
          type: "group",
          name: strings.dataAndStorage(),
          icon: "paperclip",
          iconFamily: "notesnook",
          sections: [
            {
              id: "manage-attachments",
              name: strings.manageAttachments(),
              icon: "paperclip",
              iconFamily: "notesnook",
              description: strings.manageAttachmentsDesc(),
              modifer: () => {
                Navigation.navigate("Attachments");
              }
            },
            {
              id: "clear-cache",
              name: strings.clearCache(),
              icon: "trash",
              iconFamily: "notesnook",
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
                  filesystem
                    .getCacheSize()
                    .then(setCacheSize)
                    .catch(() => {
                      /* empty */
                    });
                  const sub = eSubscribeEvent("cache-cleared", () => {
                    setCacheSize(0);
                  });
                  return () => {
                    sub?.unsubscribe();
                  };
                }, []);
                return formatBytes(cacheSize);
              }
            }
          ]
        },
        {
          id: "account-actions-sub-section",
          type: "group",
          name: strings.accountActions(),
          icon: "user-sheet-logout",
          iconFamily: "notesnook",
          sections: [
            {
              id: "logout",
              type: "danger",
              name: strings.logout(),
              description: strings.logoutWarnin(),
              icon: "user-sheet-logout",
              iconFamily: "notesnook",
              modifer: logoutUser
            },
            {
              id: "delete-account",
              type: "danger",
              name: strings.deleteAccount(),
              icon: "user-circle-minus",
              iconFamily: "notesnook",
              description: strings.deleteAccountDesc(),
              modifer: () => {
                presentDialog({
                  title: strings.deleteAccount(),
                  paragraphColor: "red",
                  paragraph: strings.deleteAccountDesc(),
                  positiveType: "errorShade",
                  input: true,
                  secureTextEntry: true,
                  inputPlaceholder: strings.enterAccountPassword(),
                  positiveText: strings.delete(),
                  positivePress: async (value) => {
                    try {
                      if (!value || !value.trim()) {
                        ToastManager.error(
                          new Error(strings.passwordNotEntered()),
                          undefined,
                          "local"
                        );
                        return;
                      }
                      const verified = await db.user?.verifyPassword(value);
                      if (verified) {
                        setTimeout(async () => {
                          try {
                            startProgress({
                              title: "Deleting account",
                              paragraph:
                                "Please wait while we delete your account"
                            });
                            await db.user?.deleteUser(value);
                            DatabaseLogger.info("User account deleted");
                            Navigation.navigate("Notes");
                            await BiometricService.resetCredentials();
                            SettingsService.set({
                              introCompleted: true
                            });
                          } catch (e) {
                            endProgress();
                            DatabaseLogger.error(e);
                            ToastManager.error(
                              e as Error,
                              strings.failedToDeleteAccount(),
                              "global"
                            );
                          }
                        }, 300);
                      } else {
                        ToastManager.show({
                          heading: strings.passwordIncorrect(),
                          type: "error",
                          context: "global"
                        });
                      }
                    } catch (e) {
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
        }
      ]
    },
    {
      id: "sync-settings",
      name: strings.syncSettings(),
      description: strings.syncSettingsDesc(),
      type: "screen",
      icon: "arrows-clockwise",
      iconFamily: "notesnook",
      component: "offline-mode-progress",
      sections: [
        {
          id: "sync-behavior-sub-section",
          type: "group",
          name: strings.syncBehavior(),
          sections: [
            {
              id: "auto-sync",
              name: strings.autoSync(),
              description: strings.autoSyncDesc(),
              type: "switch",
              property: "disableAutoSync",
              featureId: "syncControls",
              icon: "arrows-clockwise",
              iconFamily: "notesnook"
            },
            {
              id: "disable-realtime-sync",
              name: strings.realtimeSync(),
              description: strings.realtimeSyncDesc(),
              type: "switch",
              property: "disableRealtimeSync",
              featureId: "syncControls",
              icon: "cloud-check",
              iconFamily: "notesnook"
            },
            {
              id: "offline-mode",
              icon: "wifi-slash",
              iconFamily: "notesnook",
              name: strings.fullOfflineMode(),
              description: strings.fullOfflineModeDesc(),
              type: "switch",
              property: "offlineMode",
              featureId: "fullOfflineMode",
              modifer: () => {
                const current = SettingsService.get().offlineMode;
                if (current) {
                  SettingsService.setProperty("offlineMode", false);
                  db.fs().cancel("offline-mode");
                  return;
                }
                SettingsService.setProperty("offlineMode", true);
                db.attachments.cacheAttachments().catch(() => {
                  /* empty */
                });
              }
            }
          ]
        },
        {
          id: "advanced-sync-sub-section",
          type: "group",
          name: strings.advancedSettings(),
          sections: [
            {
              id: "background-sync",
              name: strings.backgroundSync(),
              description: strings.backgroundSyncDesc(),
              type: "switch",
              property: "backgroundSync",
              icon: "arrow-u-up-left",
              iconFamily: "notesnook",
              onChange: (value) => {
                if (value) {
                  BackgroundSync.start();
                } else {
                  BackgroundSync.stop();
                }
              }
            }
          ]
        },
        {
          id: "sync-troubleshooting-sub-section",
          type: "group",
          name: strings.troubleshooting(),
          sections: [
            {
              id: "disable-sync",
              name: strings.pauseSync(),
              description: strings.pauseSyncDesc(),
              type: "switch",
              property: "disableSync",
              featureId: "syncControls",
              icon: "pause",
              iconFamily: "notesnook"
            },
            {
              id: "pull-sync",
              name: strings.forcePullChanges(),
              description: strings.forcePullChangesDesc(),
              icon: "git-pull-request",
              iconFamily: "notesnook",
              modifer: () => {
                ForceSyncSheet.present("fetch");
              }
            },
            {
              id: "push-sync",
              name: strings.forcePushChanges(),
              description: strings.forcePushChangesDesc(),
              icon: "arrow-fat-up",
              iconFamily: "notesnook",
              modifer: () => {
                ForceSyncSheet.present("send");
              }
            }
          ]
        }
      ]
    },
    {
      id: "notesnook-circle",
      name: strings.notesnookCircle(),
      icon: "users-three",
      iconFamily: "notesnook",
      type: "screen",
      description: strings.notesnookCircleDesc(),
      component: "notesnook-circle"
    },
    {
      id: "inbox-api",
      name: strings.inboxAPI(),
      icon: "inbox",
      type: "screen",
      description: strings.inboxAPIDesc(),
      sections: [
        {
          id: "inbox-api-group",
          name: strings.inboxAPI(),
          type: "group",
          sections: [
            {
              id: "toggle-inbox-api",
              name: strings.enableInboxAPI(),
              description: strings.enableInboxAPIDesc(),
              type: "switch",
              icon: "file-cloud",
              iconFamily: "notesnook",
              useHook: () => {
                return useSettingStore((state) => state.inboxEnabled);
              },
              getter: (current) => current,
              modifer: async (current) => {
                if (current) {
                  return new Promise((resolve) => {
                    presentDialog({
                      title: strings.disableInboxAPI(),
                      paragraph: strings.disableInboxAPIDesc(),
                      positiveText: strings.disable(),
                      onClose: () => {
                        resolve();
                      },
                      positivePress: async () => {
                        try {
                          await db.inboxItemsHistory.deleteFailed();
                          await db.user.discardInboxKeys();
                          useSettingStore.setState({
                            inboxEnabled: false
                          });
                          resolve();
                          return true;
                        } catch (e) {
                          ToastManager.show({
                            message: (e as Error).message,
                            context: "local"
                          });
                          DatabaseLogger.error(e);
                          return false;
                        }
                      }
                    });
                  });
                }

                try {
                  Navigation.push("SettingsGroup", {
                    id: "setup-inbox-keys",
                    name: strings.setupInboxKeys(),
                    type: "screen",
                    headerBottomBorder: true,
                    component: "setup-inbox-keys"
                  } as any);
                } catch (e) {
                  console.log(e);
                }
              }
            },
            {
              id: "manage-inbox-keys",
              name: strings.manageInboxKeys(),
              icon: "tray-arrow-down",
              iconFamily: "notesnook",
              useHook: () => useSettingStore((state) => state.inboxEnabled),
              hidden: (current) => !current,
              description: strings.manageInboxKeysDesc(),
              onVerify: async () => {
                return new Promise((resolve) => {
                  verifyUser(
                    "global",
                    () => {
                      resolve(true);
                    },
                    false,
                    () => resolve(false)
                  );
                });
              },
              type: "screen",
              headerBottomBorder: true,
              component: "manage-inbox-keys"
            },
            {
              id: "inbox-keys",
              name: strings.viewAPIKeys(),
              description: strings.viewAPIKeysDesc(),
              useHook: () => useSettingStore((state) => state.inboxEnabled),
              hidden: (current) => !current,
              type: "screen",
              component: "inbox-keys",
              headerBottomBorder: true,
              icon: "key",
              iconFamily: "notesnook"
            },
            {
              id: "failed-inbox-items",
              name: strings.failedInboxItems(),
              description: strings.failedInboxItemsDesc(),
              useHook: () => useSettingStore((state) => state.inboxEnabled),
              hidden: (current) => !current,
              type: "screen",
              component: "failed-inbox-items",
              icon: "warning-circle",
              iconFamily: "notesnook",
              hideHeader: true
            }
          ]
        }
      ]
    }
  ]
};
