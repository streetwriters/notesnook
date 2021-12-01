import React, { useEffect } from "react";
import { useStore, store } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import { useStore as useThemeStore } from "./stores/theme-store";
import { resetReminders } from "./common/reminders";
import {
  AppEventManager,
  AppEvents,
  introduceFeatures,
  showUpgradeReminderDialogs,
} from "./common";
import { db } from "./common/db";
import { CHECK_IDS, EV, EVENTS } from "notes-core/common";
import { registerKeyMap } from "./common/key-map";
import { isUserPremium } from "./hooks/use-is-user-premium";
import { loadTrackerScript } from "./utils/analytics";
import useAnnouncements from "./utils/use-announcements";
import { showAnnouncementDialog } from "./common/dialog-controller";
import useSystemTheme from "./utils/use-system-theme";

if (process.env.NODE_ENV === "production") {
  loadTrackerScript();
  console.log = () => {};
}

export default function AppEffects({ setShow }) {
  const refreshColors = useStore((store) => store.refreshColors);
  const sync = useStore((store) => store.sync);
  const refreshMenuPins = useStore((store) => store.refreshMenuPins);
  const updateLastSynced = useStore((store) => store.updateLastSynced);
  const setProcessingStatus = useStore((store) => store.setProcessingStatus);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const addReminder = useStore((store) => store.addReminder);
  const initUser = useUserStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  const setTheme = useThemeStore((store) => store.setTheme);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);
  const [announcements, remove] = useAnnouncements("dialog");
  const isSystemThemeDark = useSystemTheme();

  useEffect(
    function initializeApp() {
      refreshColors();
      refreshMenuPins();
      initNotes();
      (async function () {
        await updateLastSynced();
        await resetReminders();
        setIsVaultCreated(await db.vault.exists());
        if (await initUser()) {
          showUpgradeReminderDialogs();
          await sync();
        }
      })();
    },
    [
      sync,
      updateLastSynced,
      refreshColors,
      refreshMenuPins,
      initUser,
      initNotes,
      addReminder,
      setIsVaultCreated,
    ]
  );

  useEffect(() => {
    const userCheckStatusEvent = EV.subscribe(
      EVENTS.userCheckStatus,
      async (type) => {
        if (isUserPremium()) {
          return { type, result: true };
        } else {
          if (type !== CHECK_IDS.databaseSync)
            await import("./common/dialogcontroller").then((dialogs) =>
              dialogs.showBuyDialog()
            );
          return { type, result: false };
        }
      }
    );

    const attachmentsLoadingEvent = EV.subscribe(
      EVENTS.attachmentsLoading,
      ({ type, total, current }) => {
        const [key, status] = getProcessingStatusFromType(type);

        if (current === total) setProcessingStatus(key);
        else
          setProcessingStatus(
            key,
            `${status} attachments (${current}/${total})`,
            0
          );
      }
    );

    const progressEvent = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ type, total, loaded }) => {
        const [key] = getProcessingStatusFromType(type);
        if (!key) return;

        const processingStatus = store.get().processingStatuses[key];
        if (!processingStatus) return;
        const { status } = processingStatus;
        const percent = Math.round((loaded / total) * 100);

        if (loaded === total) setProcessingStatus(key, status, 100);
        else setProcessingStatus(key, status, percent);
      }
    );

    registerKeyMap();
    return () => {
      userCheckStatusEvent.unsubscribe();
      attachmentsLoadingEvent.unsubscribe();
      progressEvent.unsubscribe();
    };
  }, [setProcessingStatus]);

  useEffect(() => {
    setShow(!isFocusMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    introduceFeatures();
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    if (!announcements.length) return;
    (async () => {
      await showAnnouncementDialog(announcements[0], remove);
    })();
  }, [announcements, remove]);

  useEffect(() => {
    if (!followSystemTheme) return;
    setTheme(isSystemThemeDark ? "dark" : "light");
  }, [isSystemThemeDark, followSystemTheme, setTheme]);

  return <React.Fragment />;
}

function getProcessingStatusFromType(type) {
  switch (type) {
    case "download":
      return ["downloadingAttachments", "Downloading"];
    case "upload":
      return ["uploadingAttachments", "Uploading"];
    case "encrypt":
      return ["encryptingAttachments", "Encrypting"];
    default:
      return undefined;
  }
}
