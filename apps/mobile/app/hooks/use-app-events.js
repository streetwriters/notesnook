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

import NetInfo from "@react-native-community/netinfo";
import { EV, EVENTS, SYNC_CHECK_IDS } from "@notesnook/core/common";
import { useEffect, useRef } from "react";
import {
  Appearance,
  AppState,
  Linking,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Keyboard
} from "react-native";
import * as RNIap from "react-native-iap";
import { enabled } from "react-native-privacy-snapshot";
import { Walkthrough } from "../components/walkthroughs";
import { editorController, editorState } from "../screens/editor/tiptap/utils";
import {
  clearMessage,
  setEmailVerifyMessage,
  setLoginMessage,
  setRecoveryKeyMessage
} from "../services/message";
import PremiumService from "../services/premium";
import SettingsService from "../services/settings";
import { updateStatusBarColor } from "../utils/color-scheme";
import { DatabaseLogger, db } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import {
  eClearEditor,
  eCloseSheet,
  eOnLoadNote,
  refreshNotesPage
} from "../utils/events";
import Sync from "../services/sync";
import { initAfterSync } from "../stores";
import { SyncStatus, useUserStore } from "../stores/use-user-store";
import { useMessageStore } from "../stores/use-message-store";
import { useSettingStore } from "../stores/use-setting-store";
import { useAttachmentStore } from "../stores/use-attachment-store";
import { useNoteStore } from "../stores/use-notes-store";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from "../services/event-manager";
import { useEditorStore } from "../stores/use-editor-store";
import { useDragState } from "../screens/settings/editor/state";
import { useCallback } from "react";
import { clearAppState } from "../screens/editor/tiptap/utils";
import { tabBarRef } from "../utils/global-refs";
import BackupService from "../services/backup";
import { sleep } from "../utils/time";
import notifee from "@notifee/react-native";

const SodiumEventEmitter = new NativeEventEmitter(NativeModules.Sodium);
export const useAppEvents = () => {
  const loading = useNoteStore((state) => state.loading);
  const setLastSynced = useUserStore((state) => state.setLastSynced);
  const setUser = useUserStore((state) => state.setUser);
  const syncedOnLaunch = useRef(false);
  const verify = useUserStore((state) => state.verifyUser);
  const syncing = useUserStore((state) => state.syncing);
  const refValues = useRef({
    subsriptionSuccessListener: null,
    subsriptionErrorListener: null,
    isUserReady: false,
    prevState: null,
    showingDialog: false,
    removeInternetStateListener: null,
    isReconnecting: false,
    initialUrl: null,
    backupDidWait: false
  });

  const onLoadingAttachmentProgress = (data) => {
    useAttachmentStore
      .getState()
      .setLoading(data.total === data.current ? null : data);
  };

  const onFileEncryptionProgress = ({ total, progress }) => {
    useAttachmentStore
      .getState()
      .setEncryptionProgress((progress / total).toFixed(2));
  };
  const onSyncProgress = ({ type, total, current }) => {
    if (type !== "download") return;
    if (total < 10 || current % 10 === 0) {
      initAfterSync();
    }
  };

  useEffect(() => {
    if (!loading) {
      const eventManager = db?.eventManager;
      eventManager?.subscribe(EVENTS.syncCompleted, onSyncComplete);
      db?.eventManager?.subscribe(EVENTS.syncProgress, onSyncProgress);
      db?.eventManager?.subscribe(
        EVENTS.databaseSyncRequested,
        onRequestPartialSync
      );
    }

    return () => {
      const eventManager = db?.eventManager;
      eventManager?.unsubscribe(EVENTS.syncCompleted, onSyncComplete);
      eventManager?.unsubscribe(EVENTS.syncProgress, onSyncProgress);
      eventManager?.unsubscribe(
        EVENTS.databaseSyncRequested,
        onRequestPartialSync
      );
    };
  }, [loading, onSyncComplete]);

  const onSyncStatusCheck = useCallback(async (type) => {
    const { disableSync, disableAutoSync } = SettingsService.get();
    switch (type) {
      case SYNC_CHECK_IDS.sync:
        return { type, result: !disableSync };
      case SYNC_CHECK_IDS.autoSync:
        return { type, result: !disableAutoSync };
      default:
        return { type, result: true };
    }
  }, []);

  const onSyncAborted = useCallback(() => {
    useUserStore.getState().setSyncing(false, SyncStatus.Failed);
    //if (error) ToastEvent.error(new Error(error));
  }, []);

  useEffect(() => {
    let subs = [
      Appearance.addChangeListener(SettingsService.setTheme),
      Linking.addEventListener("url", onUrlRecieved),
      SodiumEventEmitter.addListener(
        "onSodiumProgress",
        onFileEncryptionProgress
      )
    ];

    EV.subscribe(EVENTS.syncCheckStatus, onSyncStatusCheck);
    EV.subscribe(EVENTS.syncAborted, onSyncAborted);
    EV.subscribe(EVENTS.appRefreshRequested, onSyncComplete);
    EV.subscribe(EVENTS.userLoggedOut, onLogout);
    EV.subscribe(EVENTS.userEmailConfirmed, onEmailVerified);
    EV.subscribe(EVENTS.userSessionExpired, onSessionExpired);
    EV.subscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
    EV.subscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);
    EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachmentProgress);
    eSubscribeEvent("userLoggedIn", onUserUpdated);

    return () => {
      eUnSubscribeEvent("userLoggedIn", onUserUpdated);

      EV.unsubscribe(EVENTS.syncCheckStatus, onSyncStatusCheck);
      EV.unsubscribe(EVENTS.syncAborted, onSyncAborted);
      EV.unsubscribe(EVENTS.appRefreshRequested, onSyncComplete);
      EV.unsubscribe(EVENTS.userSessionExpired, onSessionExpired);
      EV.unsubscribe(EVENTS.userLoggedOut, onLogout);
      EV.unsubscribe(EVENTS.userEmailConfirmed, onEmailVerified);
      EV.subscribe(EVENTS.attachmentsLoading, onLoadingAttachmentProgress);
      EV.unsubscribe(EVENTS.userCheckStatus, PremiumService.onUserStatusCheck);
      EV.unsubscribe(EVENTS.userSubscriptionUpdated, onAccountStatusChange);
      EV.unsubscribeAll();

      subs.forEach((sub) => sub?.remove());
    };
  }, [
    onEmailVerified,
    onSyncComplete,
    onSyncStatusCheck,
    onUrlRecieved,
    onUserUpdated,
    onSyncAborted
  ]);

  const onSessionExpired = async () => {
    SettingsService.set({
      sessionExpired: true
    });
    eSendEvent("session_expired");
  };

  useEffect(() => {
    if (!refValues.current.initialUrl) {
      Linking.getInitialURL().then((url) => {
        refValues.current.initialUrl = url;
      });
    }
    let sub;
    if (!loading && !verify) {
      setTimeout(() => {
        sub = AppState.addEventListener("change", onAppStateChanged);
        if (
          refValues.current.initialUrl?.startsWith(
            "https://app.notesnook.com/account/verified"
          )
        ) {
          onEmailVerified();
        }
      }, 1000);
      onUserUpdated();
      refValues.current.removeInternetStateListener = NetInfo.addEventListener(
        onInternetStateChanged
      );
    }
    return () => {
      refValues.current?.removeInternetStateListener &&
        // eslint-disable-next-line react-hooks/exhaustive-deps
        refValues.current?.removeInternetStateListener();
      sub?.remove();
      unsubIAP();
    };
  }, [
    loading,
    onAppStateChanged,
    onEmailVerified,
    onInternetStateChanged,
    onUserUpdated,
    verify
  ]);

  const onInternetStateChanged = useCallback(async (state) => {
    if (!syncedOnLaunch.current) return;
    reconnectSSE(state);
  }, []);

  const onSyncComplete = useCallback(async () => {
    initAfterSync();
    setLastSynced(await db.lastSynced());
    eSendEvent(eCloseSheet, "sync_progress");
  }, [setLastSynced]);

  const onUrlRecieved = useCallback(
    async (res) => {
      let url = res ? res.url : "";
      try {
        if (url.startsWith("https://app.notesnook.com/account/verified")) {
          await onEmailVerified();
        } else if (url.startsWith("ShareMedia://QuickNoteWidget")) {
          clearAppState();
          editorState().movedAway = false;
          eSendEvent(eOnLoadNote, { type: "new" });
          tabBarRef.current?.goToPage(1, false);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    },
    [onEmailVerified]
  );

  const onEmailVerified = useCallback(async () => {
    let user = await db.user.getUser();
    setUser(user);
    if (!user) return;
    SettingsService.set({
      userEmailConfirmed: true
    });
    await PremiumService.setPremiumStatus();
    Walkthrough.present("emailconfirmed", false, true);
    if (user?.isEmailConfirmed) {
      clearMessage();
    }
  }, [setUser]);

  const attachIAPListeners = useCallback(async () => {
    await RNIap.initConnection()
      .catch(() => null)
      .then(async () => {
        refValues.current.subsriptionSuccessListener =
          RNIap.purchaseUpdatedListener(onSuccessfulSubscription);
        refValues.current.subsriptionErrorListener =
          RNIap.purchaseErrorListener(onSubscriptionError);
      });
  }, []);

  const onAccountStatusChange = async (userStatus) => {
    if (!PremiumService.get() && userStatus.type === 5) {
      PremiumService.subscriptions.clear();
      Walkthrough.present("prouser", false, true);
    }
    await PremiumService.setPremiumStatus();
    useMessageStore.getState().setAnnouncement();
  };

  const onRequestPartialSync = async (full, force) => {
    if (SettingsService.get().disableAutoSync) return;
    DatabaseLogger.info(`onRequestPartialSync full:${full}, force:${force}`);
    if (full || force) {
      await Sync.run("global", force, full);
    } else {
      await Sync.run("global", false, false);
    }
  };

  const onLogout = async (reason) => {
    console.log("Logged out", reason);
    DatabaseLogger.log("User Logged Out" + reason);
    SettingsService.set({
      introCompleted: true
    });
  };

  const unsubIAP = () => {
    if (refValues.current?.subsriptionSuccessListener) {
      refValues.current.subsriptionSuccessListener?.remove();
      refValues.current.subsriptionSuccessListener = null;
    }
    if (refValues.current?.subsriptionErrorListener) {
      refValues.current.subsriptionErrorListener?.remove();
      refValues.current.subsriptionErrorListener = null;
    }
  };

  const onUserUpdated = useCallback(
    async (login) => {
      let user;
      try {
        user = await db.user.getUser();
        await PremiumService.setPremiumStatus();
        setLastSynced(await db.lastSynced());
        await useDragState.getState().init();
        if (!user) {
          return setLoginMessage();
        }

        let userEmailConfirmed = SettingsService.get().userEmailConfirmed;
        setUser(user);
        if (SettingsService.get().sessionExpired) {
          syncedOnLaunch.current = true;
          return;
        }

        clearMessage();
        attachIAPListeners();

        if (!login) {
          user = await db.user.fetchUser();
          setUser(user);
        }

        await PremiumService.setPremiumStatus();
        if (user?.isEmailConfirmed && !userEmailConfirmed) {
          setTimeout(() => {
            onEmailVerified();
          }, 1000);
          SettingsService.set({
            userEmailConfirmed: true
          });
        }
      } catch (e) {
        ToastEvent.error(e, "An error occured", "global");
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
      refValues.current.isUserReady = true;

      syncedOnLaunch.current = true;
      if (!login) {
        checkAutoBackup();
      }
    },
    [
      attachIAPListeners,
      onEmailVerified,
      setLastSynced,
      setUser,
      checkAutoBackup
    ]
  );

  const checkAutoBackup = useCallback(async () => {
    if (verify || syncing) {
      refValues.current.backupDidWait = true;
      return;
    }
    const user = await db.user.getUser();
    if (PremiumService.get() && user) {
      if (SettingsService.get().reminder === "off") {
        SettingsService.set({ reminder: "daily" });
      }
      if (
        await BackupService.checkBackupRequired(SettingsService.get().reminder)
      ) {
        if (
          !SettingsService.get().backupDirectoryAndroid &&
          Platform.OS === "android"
        )
          return;
        sleep(2000).then(() => BackupService.run());
      }
    }
  }, [verify, syncing]);

  useEffect(() => {
    if (!verify && !syncing && refValues.current.backupDidWait) {
      refValues.current.backupDidWait = false;
      checkAutoBackup();
    }
  }, [verify, syncing, checkAutoBackup]);

  const onSuccessfulSubscription = async (subscription) => {
    await PremiumService.subscriptions.set(subscription);
    await PremiumService.subscriptions.verify(subscription);
  };

  const onSubscriptionError = async (error) => {
    ToastEvent.show({
      heading: "Failed to subscribe",
      type: "error",
      message: error.message,
      context: "local"
    });
  };

  const onAppStateChanged = useCallback(
    async (state) => {
      if (state === "active") {
        notifee.setBadgeCount(0);
        updateStatusBarColor();
        if (
          SettingsService.get().appLockMode !== "background" &&
          !SettingsService.get().privacyScreen
        ) {
          enabled(false);
        }
        if (SettingsService.get().appLockMode === "background") {
          if (useSettingStore.getState().requestBiometrics) {
            useSettingStore.getState().setRequestBiometrics(false);
            return;
          }
        }
        checkAutoBackup();
        await reconnectSSE();
        await checkIntentState();
        MMKV.removeItem("appState");
        let user = await db.user.getUser();
        if (user && !user?.isEmailConfirmed) {
          try {
            let user = await db.user.fetchUser();
            if (user?.isEmailConfirmed) {
              onEmailVerified();
            }
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        let id = useEditorStore.getState().currentEditingNote;
        let note = id && db.notes.note(id).data;
        if (
          note?.locked &&
          SettingsService.get().appLockMode === "background"
        ) {
          eSendEvent(eClearEditor);
        }
        await storeAppState();
        if (
          SettingsService.get().appLockMode === "background" &&
          !useSettingStore.getState().requestBiometrics &&
          !useUserStore.getState().verifyUser
        ) {
          useUserStore.getState().setVerifyUser(true);
          if (Platform.OS === "ios") {
            editorController.current?.commands.blur();
            Keyboard.dismiss();
          }
        }
        if (
          SettingsService.get().privacyScreen ||
          SettingsService.get().appLockMode === "background"
        ) {
          !useSettingStore.getState().requestBiometrics ? enabled(true) : null;
        }
      }
    },
    [onEmailVerified]
  );

  async function reconnectSSE(connection) {
    if (refValues.current?.isReconnecting) return;
    if (!refValues.current?.isUserReady) {
      return;
    }
    if (SettingsService.get().sessionExpired) {
      refValues.current.isReconnecting = false;
      return;
    }
    refValues.current.isReconnecting = true;
    let state = connection;
    try {
      if (!state) {
        state = await NetInfo.fetch();
      }

      let user = await db.user.getUser();
      if (user && state.isConnected && state.isInternetReachable) {
        await db.connectSSE();
      } else {
        useUserStore.getState().setSyncing(false);
        await db.syncer.stop();
      }
      refValues.current.isReconnecting = false;
    } catch (e) {
      refValues.current.isReconnecting = false;
    }
  }

  async function storeAppState() {
    if (editorState().currentlyEditing) {
      let id = useEditorStore.getState().currentEditingNote;
      let note = id && db.notes.note(id).data;
      if (note?.locked) return;
      let state = JSON.stringify({
        editing: editorState().currentlyEditing,
        note: note,
        movedAway: editorState().movedAway,
        timestamp: Date.now()
      });
      MMKV.setString("appState", state);
    }
  }

  async function checkIntentState() {
    try {
      let notesAddedFromIntent = MMKV.getString("notesAddedFromIntent");
      let shareExtensionOpened = MMKV.getString("shareExtensionOpened");
      if (notesAddedFromIntent) {
        if (Platform.OS === "ios") {
          await db.initCollections();
          await db.notes.init();
        }
        useNoteStore.getState().setNotes();
        eSendEvent(refreshNotesPage);
        MMKV.removeItem("notesAddedFromIntent");
        initAfterSync();
        eSendEvent(refreshNotesPage);
      }

      if (notesAddedFromIntent || shareExtensionOpened) {
        let id = useEditorStore.getState().currentEditingNote;
        let note = id && db.notes.note(id).data;
        eSendEvent("loadingNote", note);
        eSendEvent("webview_reset");
        MMKV.removeItem("shareExtensionOpened");
      }
    } catch (e) {
      console.log(e);
    }
  }

  return true;
};
