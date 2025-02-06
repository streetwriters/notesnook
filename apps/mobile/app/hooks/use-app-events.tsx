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

import {
  EV,
  EVENTS,
  EventManagerSubscription,
  SYNC_CHECK_IDS,
  SyncStatusEvent,
  User
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import notifee from "@notifee/react-native";
import NetInfo, { NetInfoSubscription } from "@react-native-community/netinfo";
import React, { useCallback, useEffect, useRef } from "react";
import {
  AppState,
  AppStateStatus,
  EmitterSubscription,
  Keyboard,
  Linking,
  NativeEventEmitter,
  NativeEventSubscription,
  NativeModules,
  Platform
} from "react-native";
import RNBootSplash from "react-native-bootsplash";
import { checkVersion } from "react-native-check-version";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import { DatabaseLogger, db, setupDatabase } from "../common/database";
import { initializeLogger } from "../common/database/logger";
import { MMKV } from "../common/database/mmkv";
import { endProgress, startProgress } from "../components/dialogs/progress";
import Migrate from "../components/sheets/migrate";
import NewFeature from "../components/sheets/new-feature";
import ReminderSheet from "../components/sheets/reminder";
import { Walkthrough } from "../components/walkthroughs";
import {
  resetTabStore,
  useTabStore
} from "../screens/editor/tiptap/use-tab-store";
import {
  clearAppState,
  editorController,
  editorState
} from "../screens/editor/tiptap/utils";
import { useDragState } from "../screens/settings/editor/state";
import BackupService from "../services/backup";
import BiometricService from "../services/biometrics";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  presentSheet
} from "../services/event-manager";
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
  setRateAppMessage,
  setRecoveryKeyMessage,
  setUpdateAvailableMessage
} from "../services/message";
import Navigation from "../services/navigation";
import Notifications from "../services/notifications";
import PremiumService from "../services/premium";
import SettingsService from "../services/settings";
import Sync from "../services/sync";
import { clearAllStores, initAfterSync } from "../stores";
import { refreshAllStores } from "../stores/create-db-collection-store";
import { useAttachmentStore } from "../stores/use-attachment-store";
import { useMessageStore } from "../stores/use-message-store";
import { useSettingStore } from "../stores/use-setting-store";
import { changeSystemBarColors } from "../stores/use-theme-store";
import { SyncStatus, useUserStore } from "../stores/use-user-store";
import { updateStatusBarColor } from "../utils/colors";
import { BETA } from "../utils/constants";
import {
  eCloseSheet,
  eEditorReset,
  eLoginSessionExpired,
  eOnLoadNote,
  eOpenAnnouncementDialog,
  eUserLoggedIn,
  refreshNotesPage
} from "../utils/events";
import { getGithubVersion } from "../utils/github-version";
import { fluidTabsRef } from "../utils/global-refs";
import { NotesnookModule } from "../utils/notesnook-module";
import { sleep } from "../utils/time";

const onCheckSyncStatus = async (type: SyncStatusEvent) => {
  const { disableSync, disableAutoSync } = SettingsService.get();
  switch (type) {
    case SYNC_CHECK_IDS.sync:
      return { type, result: !disableSync };
    case SYNC_CHECK_IDS.autoSync:
      return { type, result: !disableAutoSync };
    default:
      return { type, result: true };
  }
};

const onSyncAborted = () => {
  useUserStore.getState().setSyncing(false, SyncStatus.Failed);
};

const onFileEncryptionProgress = ({
  total,
  progress
}: {
  total: number;
  progress: number;
}) => {
  useAttachmentStore
    .getState()
    .setEncryptionProgress(Math.round(progress / total));
};

const onDownloadingAttachmentProgress = (data: any) => {
  useAttachmentStore.getState().setDownloading(data);
};

const onUploadingAttachmentProgress = (data: any) => {
  useAttachmentStore.getState().setUploading(data);
};

const onDownloadedAttachmentProgress = (data: any) => {
  useAttachmentStore.getState().setDownloading(data);
};

const onUploadedAttachmentProgress = (data: any) => {
  useAttachmentStore.getState().setUploading(data);
};

const onUserSessionExpired = async () => {
  SettingsService.set({
    sessionExpired: true
  });
  eSendEvent(eLoginSessionExpired);
};

const onAppOpenedFromURL = async (event: { url: string }) => {
  const url = event.url;

  try {
    if (url.startsWith("https://app.notesnook.com/account/verified")) {
      await onUserEmailVerified();
    } else if (url.startsWith("ShareMedia://QuickNoteWidget")) {
      clearAppState();
      editorState().movedAway = false;
      eSendEvent(eOnLoadNote, { newNote: true });
      fluidTabsRef.current?.goToPage("editor", false);
      return;
    } else if (url.startsWith("https://notesnook.com/open_note")) {
      const id = new URL(url).searchParams.get("id");
      if (id) {
        const note = await db.notes.note(id);
        if (note) {
          eSendEvent(eOnLoadNote, {
            item: note
          });
          fluidTabsRef.current?.goToPage("editor", false);
        }
      }
    } else if (url.startsWith("https://notesnook.com/open_reminder")) {
      const id = new URL(url).searchParams.get("id");
      if (id) {
        const reminder = await db.reminders.reminder(id);
        if (reminder) ReminderSheet.present(reminder);
      }
    } else if (url.startsWith("https://notesnook.com/new_reminder")) {
      ReminderSheet.present();
    }
  } catch (e) {
    console.error(e);
  }
};

const onUserEmailVerified = async () => {
  const user = await db.user.getUser();
  useUserStore.getState().setUser(user);
  if (!user) return;
  SettingsService.set({
    userEmailConfirmed: true
  });
  await PremiumService.setPremiumStatus();
  Walkthrough.present("emailconfirmed", false, true);
  if (user?.isEmailConfirmed) {
    clearMessage();
  }
};

const onUserSubscriptionStatusChanged = async (
  subscription: User["subscription"]
) => {
  if (!PremiumService.get() && subscription.type === 5) {
    PremiumService.subscriptions.clear();
    Walkthrough.present("prouser", false, true);
  }
  await PremiumService.setPremiumStatus();
  useMessageStore.getState().setAnnouncement();
};

const onRequestPartialSync = async (
  full: boolean,
  force: boolean,
  lastSyncTime?: number | undefined
) => {
  if (SettingsService.get().disableAutoSync) return;
  DatabaseLogger.info(
    `onRequestPartialSync full:${full}, force:${force}, lastSyncTime:${lastSyncTime}`
  );

  await Sync.run(
    "global",
    force,
    full ? "full" : "send",
    undefined,
    lastSyncTime
  );
};

const onLogout = async (reason: string) => {
  DatabaseLogger.log("User Logged Out " + reason);
  setLoginMessage();
  await PremiumService.setPremiumStatus();
  await BiometricService.resetCredentials();
  MMKV.clearStore();
  resetTabStore();
  clearAllStores();
  setImmediate(() => {
    refreshAllStores();
  });
  Navigation.queueRoutesForUpdate();
  SettingsService.resetSettings();
  useUserStore.getState().setUser(null);
  useUserStore.getState().setSyncing(false);
};

async function checkForShareExtensionLaunchedInBackground() {
  try {
    const notesAddedFromIntent = MMKV.getString("notesAddedFromIntent");
    const shareExtensionOpened = MMKV.getString("shareExtensionOpened");
    if (notesAddedFromIntent) {
      if (Platform.OS === "ios") {
        await db.initCollections();
        await db.notes.init();
      }
      eSendEvent(refreshNotesPage);
      MMKV.removeItem("notesAddedFromIntent");
      initAfterSync();
      eSendEvent(refreshNotesPage);
    }

    if (notesAddedFromIntent || shareExtensionOpened) {
      const id = useTabStore.getState().getCurrentNoteId();
      const note = id && (await db.notes.note(id));
      eSendEvent(eEditorReset);
      if (note) setTimeout(() => eSendEvent("loadingNote", note), 1);
      MMKV.removeItem("shareExtensionOpened");
    }
  } catch (e) {}
}

async function saveEditorState() {
  if (!editorState().movedAway) {
    const id = useTabStore.getState().getCurrentNoteId();
    const note = id ? await db.notes.note(id) : undefined;
    const locked = note && (await db.vaults.itemExists(note));
    if (locked) return;
    const state = JSON.stringify({
      editing: editorState().currentlyEditing,
      movedAway: editorState().movedAway,
      timestamp: Date.now()
    });
    NotesnookModule.setAppState(state);
  } else {
    NotesnookModule.setAppState("");
  }
}

const onSuccessfulSubscription = async (
  subscription: RNIap.ProductPurchase | RNIap.SubscriptionPurchase
) => {
  await PremiumService.subscriptions.set(subscription);
  await PremiumService.subscriptions.verify(subscription);
};

const onSubscriptionError = async (error: RNIap.PurchaseError) => {
  ToastManager.show({
    heading: strings.failedToSubscribe(),
    type: "error",
    message: error.message,
    context: "local"
  });
};

const SodiumEventEmitter = new NativeEventEmitter(NativeModules.Sodium);

const doAppLoadActions = async () => {
  if (SettingsService.get().sessionExpired) {
    eSendEvent(eLoginSessionExpired);
    return;
  }
  notifee.setBadgeCount(0);

  if (!(await db.user.getUser())) {
    setLoginMessage();
    return;
  }

  await useMessageStore.getState().setAnnouncement();
  if (NewFeature.present()) return;
  if (await checkAppUpdateAvailable()) return;
  if (await checkForRateAppRequest()) return;
  if (await PremiumService.getRemainingTrialDaysStatus()) return;
  if (SettingsService.get().introCompleted) {
    useMessageStore.subscribe((state) => {
      const dialogs = state.dialogs;
      if (dialogs.length > 0) {
        eSendEvent(eOpenAnnouncementDialog, dialogs[0]);
      }
    });
  }
};

const checkAppUpdateAvailable = async () => {
  if (__DEV__ || Config.isTesting === "true" || Config.FDROID_BUILD || BETA)
    return;
  try {
    const version =
      Config.GITHUB_RELEASE === "true"
        ? await getGithubVersion()
        : await checkVersion();
    if (!version || !version?.needsUpdate) return false;

    setUpdateAvailableMessage(version);
    return true;
  } catch (e) {
    return false;
  }
};

const checkForRateAppRequest = async () => {
  const rateApp = SettingsService.get().rateApp as number;
  if (
    rateApp &&
    rateApp < Date.now() &&
    !useMessageStore.getState().message?.visible
  ) {
    setRateAppMessage();
    return false;
  }
  return false;
};

const IsDatabaseMigrationRequired = () => {
  if (!db.migrations.required() || useUserStore.getState().appLocked)
    return false;

  presentSheet({
    component: <Migrate />,
    onClose: () => {
      if (!db.migrations.required()) {
        initializeDatabase();
      }
    },
    disableClosing: true
  });
  return true;
};

const initializeDatabase = async (password?: string) => {
  if (useUserStore.getState().appLocked) return;
  if (!db.isInitialized) {
    RNBootSplash.hide({ fade: false });
    changeSystemBarColors();

    DatabaseLogger.info("Initializing database");
    try {
      await setupDatabase(password);
      await db.init();
      Sync.run();
    } catch (e) {
      DatabaseLogger.error(e as Error);
      ToastManager.error(e as Error, "Error initializing database", "global");
    }
  }

  if (IsDatabaseMigrationRequired()) return;

  if (db.isInitialized) {
    Notifications.setupReminders(true);
    if (SettingsService.get().notifNotes) {
      Notifications.pinQuickNote(false);
    }
    useSettingStore.getState().setAppLoading(false);
    DatabaseLogger.info("Database initialized");
  }
  Walkthrough.init();
};

export const useAppEvents = () => {
  const isAppLoading = useSettingStore((state) => state.isAppLoading);
  const [setLastSynced, setUser, appLocked, syncing] = useUserStore((state) => [
    state.setLastSynced,
    state.setUser,
    state.appLocked,
    state.syncing
  ]);

  const syncedOnLaunch = useRef(false);
  const refValues = useRef<
    Partial<{
      subsriptionSuccessListener: EmitterSubscription;
      subsriptionErrorListener: EmitterSubscription;
      prevState: AppStateStatus;
      removeInternetStateListener: NetInfoSubscription;
      initialUrl: string;
      backupDidWait: boolean;
      isConnectingSSE: boolean;
    }>
  >({});

  const onSyncComplete = useCallback(async () => {
    initAfterSync();
    setLastSynced(await db.lastSynced());
    eSendEvent(eCloseSheet, "sync_progress");
  }, [setLastSynced]);

  useEffect(() => {
    if (isAppLoading) return;

    let subscriptions: EventManagerSubscription[] = [];
    const eventManager = db.eventManager;
    subscriptions = [
      eventManager?.subscribe(EVENTS.syncCompleted, onSyncComplete),
      eventManager?.subscribe(
        EVENTS.databaseSyncRequested,
        onRequestPartialSync
      )
    ];

    return () => {
      subscriptions.forEach((sub) => sub?.unsubscribe?.());
    };
  }, [isAppLoading, onSyncComplete]);

  const subscribeToPurchaseListeners = useCallback(async () => {
    if (Platform.OS === "android") {
      try {
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      } catch (e) {
        e;
      }
    }
    refValues.current.subsriptionSuccessListener =
      RNIap.purchaseUpdatedListener(onSuccessfulSubscription);
    refValues.current.subsriptionErrorListener =
      RNIap.purchaseErrorListener(onSubscriptionError);
  }, []);

  const unsubscribePurchaseListeners = () => {
    if (refValues.current?.subsriptionSuccessListener) {
      refValues.current.subsriptionSuccessListener?.remove();
      refValues.current.subsriptionSuccessListener = undefined;
    }
    if (refValues.current?.subsriptionErrorListener) {
      refValues.current.subsriptionErrorListener?.remove();
      refValues.current.subsriptionErrorListener = undefined;
    }
  };

  const checkAutoBackup = useCallback(async () => {
    const { appLocked, syncing } = useUserStore.getState();

    if (appLocked || syncing) {
      refValues.current.backupDidWait = true;
      return;
    }
    const user = await db.user.getUser();
    if (PremiumService.get() && user) {
      if (
        SettingsService.get().backupDirectoryAndroid ||
        Platform.OS !== "android"
      ) {
        const partialBackup = await BackupService.checkBackupRequired(
          SettingsService.get().reminder,
          "lastBackupDate"
        );
        const fullBackup = await BackupService.checkBackupRequired(
          SettingsService.get().fullBackupReminder,
          "lastFullBackupDate"
        );

        await sleep(2000);

        if (partialBackup) {
          await BackupService.run();
        }

        if (fullBackup) {
          await BackupService.run(false, undefined, "full");
        }
      }

      if (SettingsService.getProperty("offlineMode")) {
        db.attachments.cacheAttachments().catch(() => {
          /* empty */
        });
      }
    }
  }, []);

  const onUserUpdated = useCallback(
    async (isLogin?: boolean) => {
      let user;
      try {
        user = await db.user.getUser();
        await PremiumService.setPremiumStatus();
        setLastSynced(await db.lastSynced());
        await useDragState.getState().init();
        if (!user) return;

        const isUserEmailConfirmed = SettingsService.get().userEmailConfirmed;
        setUser(user);

        useUserStore.setState({
          profile: db.settings.getProfile()
        });

        if (SettingsService.get().sessionExpired) {
          syncedOnLaunch.current = true;
          return;
        }

        clearMessage();
        subscribeToPurchaseListeners();
        if (!isLogin) {
          user = await db.user.fetchUser();
          setUser(user);
        } else {
          SettingsService.set({
            encryptedBackup: true
          });
        }

        await PremiumService.setPremiumStatus();
        if (user?.isEmailConfirmed && !isUserEmailConfirmed) {
          setTimeout(() => {
            onUserEmailVerified();
          }, 1000);
          SettingsService.set({
            userEmailConfirmed: true
          });
        }
      } catch (e) {
        ToastManager.error(e as Error, "Error updating user", "global");
      }

      user = await db.user.getUser();
      if (
        user?.isEmailConfirmed &&
        !SettingsService.get().recoveryKeySaved &&
        !useMessageStore.getState().message?.visible
      ) {
        setRecoveryKeyMessage();
      }
      if (!user?.isEmailConfirmed) setEmailVerifyMessage();

      syncedOnLaunch.current = true;
      if (!isLogin) {
        checkAutoBackup();
      }
    },
    [subscribeToPurchaseListeners, setLastSynced, setUser, checkAutoBackup]
  );

  useEffect(() => {
    const subscriptions = [
      EV.subscribe(EVENTS.syncCheckStatus, onCheckSyncStatus),
      EV.subscribe(EVENTS.syncAborted, onSyncAborted),
      EV.subscribe(EVENTS.appRefreshRequested, onSyncComplete),
      EV.subscribe(EVENTS.userLoggedOut, onLogout),
      EV.subscribe(EVENTS.userEmailConfirmed, onUserEmailVerified),
      EV.subscribe(EVENTS.userSessionExpired, onUserSessionExpired),
      EV.subscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck),
      EV.subscribe(
        EVENTS.userSubscriptionUpdated,
        onUserSubscriptionStatusChanged
      ),
      EV.subscribe(EVENTS.fileDownload, onDownloadingAttachmentProgress),
      EV.subscribe(EVENTS.fileUpload, onUploadingAttachmentProgress),
      EV.subscribe(EVENTS.fileDownloaded, onDownloadedAttachmentProgress),
      EV.subscribe(EVENTS.fileUploaded, onUploadedAttachmentProgress),
      EV.subscribe(EVENTS.downloadCanceled, (data) => {
        useAttachmentStore.getState().setDownloading(data);
      }),
      EV.subscribe(EVENTS.uploadCanceled, (data) => {
        useAttachmentStore.getState().setUploading(data);
      }),
      EV.subscribe(EVENTS.migrationStarted, (name) => {
        if (
          name !== "notesnook" ||
          !SettingsService.getProperty("introCompleted") ||
          Config.isTesting === "true"
        )
          return;
        startProgress({
          title: "Migrating Data",
          paragraph: "Please wait while we migrate your data",
          canHideProgress: false,
          fillBackground: true
        });
      }),
      EV.subscribe(EVENTS.migrationFinished, (name) => {
        if (
          name !== "notesnook" ||
          !SettingsService.getProperty("introCompleted") ||
          Config.isTesting === "true"
        )
          return;
        endProgress();
      }),
      EV.subscribe(EVENTS.vaultLocked, async () => {
        // Lock all notes in all tabs...
        for (const tab of useTabStore.getState().tabs) {
          const noteId = useTabStore.getState().getTab(tab.id)?.session?.noteId;
          if (!noteId) continue;
          const note = await db.notes.note(noteId);
          const locked = note && (await db.vaults.itemExists(note));
          if (locked) {
            useTabStore.getState().updateTab(tab.id, {
              session: {
                locked: true,
                noteLocked: true
              }
            });
          }
        }
      }),
      eSubscribeEvent(eUserLoggedIn, onUserUpdated)
    ];

    const emitterSubscriptions = [
      Linking.addEventListener("url", onAppOpenedFromURL),

      SodiumEventEmitter.addListener(
        "onSodiumProgress",
        onFileEncryptionProgress
      )
    ];

    return () => {
      emitterSubscriptions.forEach((sub) => sub?.remove?.());
      subscriptions.forEach((sub) => sub?.unsubscribe?.());
      EV.unsubscribeAll();
    };
  }, [onSyncComplete, onUserUpdated]);

  useEffect(() => {
    const onInternetStateChanged = async () => {
      if (!syncedOnLaunch.current) return;
      Sync.run("global", false, "full");
      reconnectSSE();
    };

    const onAppStateChanged = async (state: AppStateStatus) => {
      if (state === "active") {
        notifee.setBadgeCount(0);
        updateStatusBarColor();
        checkAutoBackup();
        Sync.run("global", false, "full");
        reconnectSSE();
        await checkForShareExtensionLaunchedInBackground();
        NotesnookModule.setAppState("");
        let user = await db.user.getUser();
        if (user && !user?.isEmailConfirmed) {
          try {
            user = await db.user.fetchUser();
            if (user?.isEmailConfirmed) {
              onUserEmailVerified();
            }
          } catch (e) {
            console.error(e);
          }
        }
        //@ts-ignore
        globalThis["IS_SHARE_EXTENSION"] = false;

        if (
          SettingsService.getBackgroundEnterTime() + 60 * 1000 * 10 <
          Date.now()
        ) {
          // Reset the editor if the app has been in background for more than 10 minutes.
          eSendEvent(eEditorReset);
        }
      } else {
        await saveEditorState();
        if (
          SettingsService.canLockAppInBackground() &&
          !useSettingStore.getState().requestBiometrics &&
          !useUserStore.getState().appLocked &&
          !useUserStore.getState().disableAppLockRequests
        ) {
          if (SettingsService.shouldLockAppOnEnterForeground()) {
            DatabaseLogger.log(`AppEvents: Locking app on enter background`);
            useUserStore.getState().lockApp(true);
          }

          if (Platform.OS === "ios") {
            editorController.current?.commands.blur(
              useTabStore.getState().currentTab
            );
            Keyboard.dismiss();
          }
        }
      }
    };

    if (!refValues.current.initialUrl) {
      Linking.getInitialURL().then((url) => {
        if (url) {
          refValues.current.initialUrl = url;
        }
      });
    }
    let sub: NativeEventSubscription;
    if (!isAppLoading && !appLocked) {
      setTimeout(() => {
        sub = AppState.addEventListener("change", onAppStateChanged);
        if (
          refValues.current.initialUrl &&
          !refValues.current.initialUrl?.includes("open_note")
        ) {
          onAppOpenedFromURL({
            url: refValues.current.initialUrl!
          });
        }
      }, 1000);

      refValues.current.removeInternetStateListener = NetInfo.addEventListener(
        onInternetStateChanged
      );
    }
    return () => {
      refValues.current?.removeInternetStateListener &&
        // eslint-disable-next-line react-hooks/exhaustive-deps
        refValues.current?.removeInternetStateListener();
      sub?.remove();
      unsubscribePurchaseListeners();
    };
  }, [isAppLoading, appLocked, checkAutoBackup]);

  useEffect(() => {
    if (!appLocked && !syncing && refValues.current.backupDidWait) {
      refValues.current.backupDidWait = false;
      checkAutoBackup();
    }
  }, [appLocked, syncing, checkAutoBackup]);

  async function reconnectSSE() {
    try {
      if (refValues.current?.isConnectingSSE) return;
      refValues.current.isConnectingSSE = true;
      await db.connectSSE();
      refValues.current.isConnectingSSE = false;
    } catch (e) {
      refValues.current.isConnectingSSE = false;
      DatabaseLogger.error(e as Error);
    }
  }

  useEffect(() => {
    if (!isAppLoading) {
      onUserUpdated();
      doAppLoadActions();
    }
  }, [isAppLoading, onUserUpdated]);

  useEffect(() => {
    if (!appLocked && isAppLoading) {
      initializeLogger()
        .catch((e) => {})
        .finally(() => {
          //@ts-ignore
          initializeDatabase();
        });
    }
  }, [appLocked, isAppLoading]);
};
