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

import React, { useEffect } from "react";
import { useStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useEditorStore } from "./stores/editor-store";
import { useStore as useAnnouncementStore } from "./stores/announcement-store";
import { useStore as useSettingStore } from "./stores/setting-store";
import {
  resetNotices,
  scheduleBackups,
  scheduleFullBackups
} from "./common/notices";
import { introduceFeatures, showUpgradeReminderDialogs } from "./common";
import { AppEventManager, AppEvents } from "./common/app-events";
import { db } from "./common/db";
import { EV, EVENTS } from "@notesnook/core";
import { registerKeyMap } from "./common/key-map";
import { updateStatus, removeStatus, getStatus } from "./hooks/use-status";
import {
  interruptedOnboarding,
  OnboardingDialog
} from "./dialogs/onboarding-dialog";
import { hashNavigate } from "./navigation";
import { desktop } from "./common/desktop-bridge";
import { FeatureDialog } from "./dialogs/feature-dialog";
import { AnnouncementDialog } from "./dialogs/announcement-dialog";
import { logger } from "./utils/logger";

export default function AppEffects() {
  const refreshNavItems = useStore((store) => store.refreshNavItems);
  const toggleListPane = useStore((store) => store.toggleListPane);
  const updateLastSynced = useStore((store) => store.updateLastSynced);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const initUser = useUserStore((store) => store.init);
  const initStore = useStore((store) => store.init);
  const setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  const initEditorStore = useEditorStore((store) => store.init);
  const dialogAnnouncements = useAnnouncementStore(
    (store) => store.dialogAnnouncements
  );

  useEffect(
    function initializeApp() {
      initStore();
      initEditorStore();

      (async function () {
        await refreshNavItems();
        await updateLastSynced();
        if (await initUser()) {
          showUpgradeReminderDialogs();
        }
        await resetNotices();
        setIsVaultCreated(await db.vault.exists());

        const onboardingKey = interruptedOnboarding();
        if (onboardingKey) await OnboardingDialog.show({ type: onboardingKey });
        await FeatureDialog.show({ featureName: "highlights" });
        await scheduleBackups();
        await scheduleFullBackups();
        if (useSettingStore.getState().isFullOfflineMode)
          // NOTE: we deliberately don't await here because we don't want to pause execution.
          db.attachments.cacheAttachments().catch(logger.error);
      })();
    },
    [
      initEditorStore,
      initStore,
      updateLastSynced,
      refreshNavItems,
      initUser,
      setIsVaultCreated
    ]
  );

  useEffect(() => {
    // const systemTimeInvalidEvent = EV.subscribe(
    //   EVENTS.systemTimeInvalid,
    //   async ({ serverTime, localTime }) => {
    //     await showInvalidSystemTimeDialog({ serverTime, localTime });
    //   }
    // );

    function handleDownloadUploadProgress(
      type: ProcessingType,
      total: number,
      current: number
    ) {
      const [key, status] = getProcessingStatusFromType(type);

      if (current === total) {
        removeStatus(key);
      } else {
        updateStatus({
          key,
          status: `${status} attachments`,
          current,
          total,
          progress: 0
        });
      }
    }

    const fileDownloadEvents = EV.subscribeMulti(
      [EVENTS.fileDownloaded, EVENTS.fileDownload],
      ({ total, current }: { total: number; current: number }) => {
        handleDownloadUploadProgress("download", total, current);
      },
      null
    );

    const fileUploadEvents = EV.subscribeMulti(
      [EVENTS.fileUploaded, EVENTS.fileUpload],
      ({ total, current }: { total: number; current: number }) => {
        handleDownloadUploadProgress("upload", total, current);
      },
      null
    );

    const fileEncrypted = AppEventManager.subscribe(
      AppEvents.fileEncrypted,
      ({ total, current }: { total: number; current: number }) => {
        handleDownloadUploadProgress("encrypt", total, current);
      }
    );

    const progressEvent = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({
        type,
        total,
        loaded
      }: {
        type: ProcessingType;
        total: number;
        loaded: number;
      }) => {
        const [key, status] = getProcessingStatusFromType(type);
        if (!key) return;

        const percent = Math.round((loaded / total) * 100);
        const oldStatus = getStatus(key);
        const text = oldStatus?.status || `${status} attachment`;

        if (
          (!oldStatus ||
            (oldStatus.total === undefined &&
              oldStatus.current === undefined) ||
            oldStatus.total === oldStatus.current) &&
          loaded === total
        ) {
          removeStatus(key);
        } else {
          updateStatus({
            ...oldStatus,
            key,
            status: text,
            progress: loaded === total ? 100 : percent
          });
        }
      }
    );

    registerKeyMap();
    return () => {
      [
        ...fileDownloadEvents,
        ...fileUploadEvents,
        progressEvent,
        fileEncrypted
      ].forEach((e) => e.unsubscribe());
      //  systemTimeInvalidEvent.unsubscribe();
    };
  }, []);

  useEffect(() => {
    toggleListPane(!isFocusMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    introduceFeatures();
  }, []);

  useEffect(() => {
    if (!dialogAnnouncements.length || IS_TESTING) return;
    (async () => {
      await AnnouncementDialog.show({ announcement: dialogAnnouncements[0] });
    })();
  }, [dialogAnnouncements]);

  useEffect(() => {
    const { unsubscribe } =
      desktop?.bridge.onCreateItem.subscribe(undefined, {
        onData(itemType) {
          switch (itemType) {
            case "note":
              useEditorStore.getState().newSession();
              break;
            case "notebook":
              hashNavigate("/notebooks/create", { replace: true });
              break;
            case "reminder":
              hashNavigate("/reminders/create", { replace: true });
              break;
          }
        }
      }) || {};

    return () => {
      unsubscribe?.();
    };
  }, []);

  return <React.Fragment />;
}

type ProcessingType = "download" | "upload" | "encrypt";
function getProcessingStatusFromType(type: ProcessingType) {
  switch (type) {
    case "download":
      return ["downloadingAttachments", "Downloading"];
    case "upload":
      return ["uploadingAttachments", "Uploading"];
    case "encrypt":
      return ["encryptingAttachments", "Encrypting"];
    default:
      return [];
  }
}
